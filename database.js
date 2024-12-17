import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bcrypt from 'bcrypt';
import Joi from 'joi';
import { validId } from './middleware/validId.js';
import { validBody } from './middleware/validBody.js';

import { MongoClient, ObjectId } from "mongodb";
import debug from 'debug';
const debugDb = debug('app:Database');

/** Generate/Parse an ObjectId */
const newId = (str) => new ObjectId(str);

/** Global variable storing the open connection, do not use it directly. */
let _db = null;

/** Connect to the database */
async function connect() {
  if (!_db) {
    const dbUrl = process.env.DB_URL;
    const dbName = process.env.DB_NAME;
    const client = await MongoClient.connect(dbUrl);
    _db = client.db(dbName);
    debugDb('Connected.');
  }
  return _db;
}

/** Connect to the database and verify the connection */
async function ping() {
  const db = await connect();
  await db.command({ ping: 1 });
  debugDb('Ping.');
}

async function GetUserEmail(userEmail) {
  const db = await connect();
  const existingUser = await db.collection('Users').findOne({ email: userEmail });
  debugDb(`GetUserEmail: ${JSON.stringify(existingUser)}`);
  if (existingUser == null) {
    debugDb(`User not found`);
    return false;
  }
  else {
    debugDb(`User found`);
    return true;
  }
}

async function CheckUserPassword(userEmail, userPassword) {
  const db = await connect();
  const existingUser = await db.collection('Users').findOne({ email: userEmail });
  const match = await bcrypt.compare(userPassword, existingUser.password);

  if (!match) {
    debugDb(`Password doesn't match`);
    return false;
  }
  else {
    debugDb(`Password matches!`);
    return true;
  }
}

async function GetUserId(user) {
  const db = await connect();
  const existingUser = await db.collection('Users').findOne({ email: user.email });
  if (existingUser) {
    return existingUser._id;
  }
  else {
    return null;
  }
}

// FIXME: add more functions here
async function GetAllUsers(keywords, role, maxAge, minAge, sortBy, pageSize, pageNumber) {
  const match = {};
  const sort = {};

  try {
    if (keywords) {
      match.$text = { $search: keywords };
    }

    if (role) {
      match.role = { $eq: role };
    }

    if (minAge && maxAge) {
      debugDb(`minAge: ${minAge}, maxAge: ${maxAge}`);
      match.age = { $gte: parseFloat(minAge), $lte: parseFloat(maxAge) };
    } else if (minAge) {
      debugDb(`minAge: ${minAge}`);
      match.age = { $gte: parseFloat(minAge) };
    }
    else if (maxAge) {
      debugDb(`maxAge: ${maxAge}`);
      match.age = { $lte: parseFloat(maxAge) };
    }

    switch (sortBy) {
      case 'givenName':
        sort.givenName = 1;
        sort.creationDate = 1;
        break;
      case 'familyName':
        sort.familyName = 1;
        sort.creationDate = 1;
        break;
      case 'role':
        sort.role = 1;
        sort.creationDate = 1;
        break;
      case 'oldest':
        sort.creationDate = -1;
        break;
      case 'newest':
        sort.creationDate = 1;
        break;
      default:
        sort.givenName = 1;
        break;
    }

    pageNumber = parseInt(pageNumber) || 1;
    pageSize = parseInt(pageSize) || 5;
    const skip = (pageNumber - 1) * pageSize;
    const limit = pageSize;
    const pipeline = [
      { $match: match },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit }
    ];

    debugDb(`Test users list`);

    const db = await connect();
    const cursor = db.collection('Users').aggregate(pipeline);
    const users = await cursor.toArray();
    return users;
  } catch (error) {
    debugDb(`Error: ${error}`);
  }
}

async function GetUserById(id) {
  const db = await connect();
  if (validId('userId') === false) {
    throw new Error(`Invalid ObjectId: ${id}`);
  }
  else {
    const user = await db.collection('Users').findOne({ _id: new ObjectId(id) });
    return user;
  }
}

async function GetUserByEmail(input) {
  const db = await connect();

  const user = await db.collection('Users').findOne({ email: input });
  debugDb(`GetUserByEmail: ${JSON.stringify(user)}`);
  return user;
}

async function addUser(user) {
  const db = await connect();
  const result = await db.collection('Users').insertOne(user);
  return result;
}

async function updateUser(id, updatedUser) {
  const db = await connect();
  const result = await db.collection('Users').updateOne({ _id: new ObjectId(id) }, { $set: updatedUser });
  return result;
}

async function deleteUser(id) {
  if (!ObjectId.isValid(id)) {
    return {};
  }
  else {
    const db = await connect();
    return await db.collection('Users').deleteOne({ _id: new ObjectId(id) });
  }
}

async function GetAllBugs(keywords, classification, maxAge, minAge, closed, sortBy, pageSize, pageNumber) {
  const match = {};
  const sort = {};

  try {
    if (keywords) {
      match.$text = { $search: keywords };
    }

    if (classification) {
      match.classification = { $eq: classification };
    }

    if (minAge && maxAge) {
      debugDb(`minAge: ${minAge}, maxAge: ${maxAge}`);
      match.age = { $gte: parseFloat(minAge), $lte: parseFloat(maxAge) };
    } else if (minAge) {
      debugDb(`minAge: ${minAge}`);
      match.age = { $gte: parseFloat(minAge) };
    }
    else if (maxAge) {
      debugDb(`maxAge: ${maxAge}`);
      match.age = { $lte: parseFloat(maxAge) };
    }

    if (closed !== undefined) {
      match.closed = { $eq: closed };
    }

    switch (sortBy) {
      case 'newest':
        sort.createdDate = 1;
        break;
      case 'oldest':
        sort.createdDate = -1;
        break;
      case 'title':
        sort.title = 1;
        sort.createdDate = -1;
        break;
      case 'classification':
        sort.classification = 1;
        sort.createdDate = -1;
        break;
      case 'assignedTo':
        sort.assignedTo = 1;
        sort.createdDate = -1;
        break;
      case 'createdBy':
        sort.createdBy = 1;
        sort.createdDate = -1;
        break;
      default:
        sort.title = 1;
        break;
    }

    pageSize = parseInt(pageSize) || 5;
    pageNumber = parseInt(pageNumber) || 1;

    const skip = (pageNumber - 1) * pageSize;
    const limit = pageSize;
    const pipeline = [
      { $match: match },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit }
    ];

    debugDb(`Test bugs list`);

    const db = await connect();
    const cursor = db.collection('Bugs').aggregate(pipeline);
    const bugs = await cursor.toArray();
    return bugs;
  } catch (error) {
    debugDb(`Error: ${error}`);
  }
}

async function GetBugById(id) {
  const db = await connect();
  debugDb(`Hitting route`);
  if (validId('userId') === false) {
    throw new Error(`Invalid ObjectId: ${id}`);
  }
  else {
    const bug = await db.collection('Bugs').findOne({ _id: new ObjectId(id) });
    debugDb(`GetBugById: ${JSON.stringify(bug)}`);
    return bug;
  }
}

async function addBug(bug) {
  const db = await connect();
  const result = await db.collection('Bugs').insertOne(bug);
  debugDb(`addBug: ${JSON.stringify(result)}`);
  return result;
}

async function updateBug(id, updatedBug) {
  const db = await connect();
  const result = await db.collection('Bugs').updateOne({ _id: new ObjectId(id) }, { $set: updatedBug });
  return result;
}

async function deleteBug(id) {
  if (!ObjectId.isValid(id)) {
    return {};
  }
  else {
    const db = await connect();
    return await db.collection('Bugs').deleteOne({ _id: new ObjectId(id) });
  }
}

async function GetAllComments(bugId) {
  const db = await connect();
  return await db.collection('Comments').find({}).toArray();
}

async function addComment(bugId, newComment) {
  const db = await connect();
  const bug = await db.collection('Bugs').findOne({ _id: new ObjectId(bugId) });
  //Getting stuck here
  if (bug.comments) {
    bug.comments.push(newComment._id);
  }
  else {
    bug.comments = [newComment._id];
  }
  await updateBug(bugId, bug);
  const result = await db.collection('Comments').insertOne(newComment);
  return result;
}

async function GetCommentById(commentId) {
  const db = await connect();
  const result = await db.collection('Comments').findOne({ _id: new ObjectId(commentId) });
  return result;
}

async function addTestCase(newTestCase) {
  const db = await connect();
  const result = await db.collection('TestCases').insertOne(newTestCase);
  return result;
}

async function GetTestCaseById(testId) {
  const db = await connect();
  const result = await db.collection('TestCases').findOne({ _id: new ObjectId(testId) });
  return result;
}

async function updateTestCase(id, updateTestCase) {
  const db = await connect();
  const result = await db.collection('TestCases').updateOne({ _id: new ObjectId(id) }, { $set: updateTestCase });
  return result;
}

async function deleteTestCase(id) {
  if (!ObjectId.isValid(id)) {
    return {};
  }
  else {
    const db = await connect();
    return await db.collection('TestCases').deleteOne({ _id: new ObjectId(id) });
  }
}

async function addEdit(newEdit) {
  const db = await connect();
  const result = await db.collection('Edits').insertOne(newEdit);
  return result;
}

async function GetRoleByName(roleName) {
  const db = await connect();
  const role = await db.collection('Roles').findOne({ name: roleName });
  return role;
}

// export functions
export {
  newId,
  connect,
  ping,

  GetAllUsers,
  GetUserById,
  GetUserByEmail,
  addUser,
  updateUser,
  deleteUser,
  GetUserEmail,
  GetUserId,
  CheckUserPassword,

  GetAllBugs,
  GetBugById,
  addBug,
  updateBug,
  deleteBug,

  GetAllComments,
  addComment,
  GetCommentById,

  addTestCase,
  GetTestCaseById,
  updateTestCase,
  deleteTestCase,

  addEdit,

  GetRoleByName
};

// test the database connection (COMMENT OUT ON DEPLOYMENT)
//ping();