import express from 'express';
const router = express.Router();
const app = express();
//Catch unhandled exceptions
app.use((err, req, res, next) => {
  res.status(err.status).json({ error: err.message });
});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('frontend/dist'));

import { GetRoleByName } from '../../database.js';
import { fetchRoles, mergePermissions, isLoggedIn, hasPermission } from '@merlin4/express-auth';

import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import Joi from 'joi';
import bcrypt from 'bcrypt';
import { addComment, deleteTestCase, GetCommentById, GetTestCaseById } from '../../database.js';
import { validId } from '../../middleware/validId.js';
import { validBody } from '../../middleware/validBody.js';

import { GetAllBugs } from '../../database.js';
import { GetBugById, GetUserById } from '../../database.js';
import { addBug } from '../../database.js';
import { updateBug } from '../../database.js';
import { deleteBug } from '../../database.js';

import { GetAllComments } from '../../database.js';
import { addTestCase } from '../../database.js';
import { updateTestCase } from '../../database.js';

import { addEdit } from '../../database.js';

import { nanoid } from 'nanoid';
nanoid(24); //=> "CppNNOuTan3ylLLLKm6OGw"

import debug from 'debug';
const debugBug = debug('app:BugRouter');

router.use(express.urlencoded({ extended: false }));

const newBugSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  stepsToReproduce: Joi.string().required(),
});

const updateBugSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string(),
  stepsToReproduce: Joi.string(),
  classification: Joi.string(),
  assignedToUserId: Joi.string(),
  assignedToUserName: Joi.string(),
  closed: Joi.bool()
});

const assignBugSchema = Joi.object({
  assignedToUserId: Joi.string().required()
});

const classifyBugSchema = Joi.object({
  classification: Joi.string().required
});

const closeBugSchema = Joi.object({
  closed: Joi.bool().required()
});

const newCommentSchema = Joi.object({
  content: Joi.string().required(),
  addedBy: Joi.string().required()
});

const newTestCaseSchema = Joi.object({
  author: Joi.string().required(),
  status: Joi.string().valid('passed', 'failed', 'pending').required()
});

const updateTestCaseSchema = Joi.object({
  author: Joi.string(),
  status: Joi.string().valid('passed', 'failed', 'pending')
});

//List Bugs
router.get('', hasPermission('canViewData'), async (req, res) => {
  const { keywords, classification, maxAge, minAge, sortBy, pageSize, pageNumber } = req.query;
  let closed;
  if (req.query.closed === 'true') {
    closed = true;
  }
  else if (req.query.closed === 'false') {
    closed = false;
  }
  else {
    closed = undefined;
  }

  try {
    const bugs = await GetAllBugs(keywords, classification, maxAge, minAge, closed, sortBy, pageSize, pageNumber);
    res.status(200).json(bugs);
  }
  catch (error) {
    res.status(500).json({ error: error.stack });
  }
});

//Get Bug by ID
router.get('/:id', validId('bugId'), hasPermission('canViewData'), async (req, res) => {
  const bugId = req.params.id;
  try {
    const bug = await GetBugById(bugId);
    if (JSON.stringify(bug) === '{}') {
      res.status(404).send({ error: `bugId ${bugId} is not a valid ObjectId.` });
    }
    else {
      res.status(200).json(bug);
    }
  } catch (error) {
    res.status(404).send({ error: `bugId ${bugId} is not a valid ObjectId.` });
  }
});

//Add Bug
router.post('', validBody(newBugSchema), hasPermission('canCreateAnyBug'), async (req, res) => {
  const newBug = req.body;
  try {
    if (validBody(newBugSchema) === false) {
      res.status(400).send({ error: validateResult.error });
    }
    else {
      let bugId = new ObjectId();
      newBug.createdOn = new Date();
      newBug.createdBy = req.auth.userId;
      newBug.classification = 'unclassified';
      newBug.closed = false;
      newBug._id = bugId;
      const result = await addBug(newBug);

      //Log edit
      let newEdit = {};
      debugBug(`New Edit: ${JSON.stringify(newEdit)}`);
      newEdit.timestamp = new Date();
      newEdit.col = "bug";
      newEdit.op = "insert";
      newEdit.target = { bugId };
      newEdit.update = newBug;
      //auth = req.auth;
      await addEdit(newEdit);
      res.status(201).json({ message: 'New Bug Added' });
    }
  } catch (error) {
    debugBug(`Error: ${error}`);
    res.status(500).send(error);
  }
});

//Update bug
router.patch('/:id', validId('bugId'), validBody(updateBugSchema), async (req, res) => {
  const bugId = req.params.id;
  const updatedBug = req.body;
  try {
    //if (hasPermission('canEditAnyBug') === true) {
    if (validId('bugId') === false) {
      res.status(400).send({ error: validateResult.error });
    }
    else if (JSON.stringify(updatedBug) === '{}') {
      res.status(400).json({ message: `Invalid request` });
    }
    else if (validBody(updateBugSchema) === false) {
      res.status(400).send({ error: validateResult.error });
    }
    else {
      updatedBug.lastUpdatedOn = new Date();
      updatedBug.lastUpdatedBy = req.auth.userId;
      const result = await updateBug(bugId, updatedBug);

      //Log edit
      let newEdit = {};
      debugBug(`New Edit: ${JSON.stringify(newEdit)}`);
      newEdit.timestamp = new Date();
      newEdit.col = "bug";
      newEdit.op = "update";
      newEdit.target = { bugId };
      newEdit.update = updatedBug;
      //auth = req.auth;
      await addEdit(newEdit);
      res.status(200).json({ message: 'Bug Updated' });
    }
    /*}
    else if (hasPermission('canEditIfAssignedTo') === true && updatedBug.assignedToUserId === req.auth.userId) {
      if (validId('bugId') === false) {
        res.status(400).send({ error: validateResult.error });
      }
      else if (JSON.stringify(updatedBug) === '{}') {
        res.status(400).json({ message: `Invalid request` });
      }
      else if (validBody(updateBugSchema) === false) {
        res.status(400).send({ error: validateResult.error });
      }
      else {
        updatedBug.lastUpdatedOn = new Date();
        updatedBug.lastUpdatedBy = req.auth.userId;
        const result = await updateBug(bugId, updatedBug);
        res.status(200).json({ message: 'Bug Updated' });

        //Log edit
        let newEdit = {};
        debugBug(`New Edit: ${JSON.stringify(newEdit)}`);
        newEdit.timestamp = new Date();
        newEdit.col = "bug";
        newEdit.op = "update";
        newEdit.target = { bugId };
        newEdit.update = updatedBug;
        auth = req.auth;
        await addEdit(newEdit);
      }
    }
    else if (hasPermission('canEditMyBug') === true && updatedBug.createdBy === req.auth.userId) {
      if (validId('bugId') === false) {
        res.status(400).send({ error: validateResult.error });
      }
      else if (JSON.stringify(updatedBug) === '{}') {
        res.status(400).json({ message: `Invalid request` });
      }
      else if (validBody(updateBugSchema) === false) {
        res.status(400).send({ error: validateResult.error });
      }
      else {
        updatedBug.lastUpdatedOn = new Date();
        updatedBug.lastUpdatedBy = req.auth.userId;
        const result = await updateBug(bugId, updatedBug);
        res.status(200).json({ message: 'Bug Updated' });

        //Log edit
        let newEdit = {};
        debugBug(`New Edit: ${JSON.stringify(newEdit)}`);
        newEdit.timestamp = new Date();
        newEdit.col = "bug";
        newEdit.op = "update";
        newEdit.target = { bugId };
        newEdit.update = updatedBug;
        auth = req.auth;
        await addEdit(newEdit);
      }
    }
    else {
      res.status(401).json({ message: `User not authorized` });
    }*/
  } catch (error) {
    debugBug(`Error: ${error}`);
    res.status(500).send(error);
  }
});

router.patch('/:id/classify', validId('bugId'), validBody(classifyBugSchema), async (req, res) => {
  const bugId = req.params.id;
  const classification = req.body.classification;
  try {
    if (hasPermission('canEditAnyBug') === true) {
      if (validId('bugId') === false) {
        res.status(400).send({ error: validateResult.error });
      }
      if (validBody(classifyBugSchema) === false) {
        res.status(400).send({ error: validateResult.error });
      }
      else {
        const updatedBug = await GetBugById(bugId);
        updatedBug.classification = classification;
        updatedBug.classifiedOn = new Date();
        updatedBug.classifiedBy = req.auth.userId;
        updatedBug.lastUpdated = new Date();

        const result = await updateBug(bugId, updatedBug);
        res.status(200).json({ message: 'Bug Classified' });
        debugBug(`Bug Classified: ${JSON.stringify(result)}`);

        //Log edit
        let newEdit = {};
        debugBug(`New Edit: ${JSON.stringify(newEdit)}`);
        newEdit.timestamp = new Date();
        newEdit.col = "bug";
        newEdit.op = "update";
        newEdit.target = { bugId };
        newEdit.update = updatedBug;
        auth = req.auth;
        await addEdit(newEdit);

      }
    }
    else if (hasPermission('canEditIfAssignedTo') === true && updatedBug.assignedToUserId === req.auth.userId) {
      if (validId('bugId') === false) {
        res.status(400).send({ error: validateResult.error });
      }
      if (validBody(classifyBugSchema) === false) {
        res.status(400).send({ error: validateResult.error });
      }
      else {
        const updatedBug = await GetBugById(bugId);
        updatedBug.classification = classification;
        updatedBug.classifiedOn = new Date();
        updatedBug.classifiedBy = req.auth.userId;
        updatedBug.lastUpdated = new Date();

        const result = await updateBug(bugId, updatedBug);
        res.status(200).json({ message: 'Bug Classified' });
        debugBug(`Bug Classified: ${JSON.stringify(result)}`);

        //Log edit
        let newEdit = {};
        debugBug(`New Edit: ${JSON.stringify(newEdit)}`);
        newEdit.timestamp = new Date();
        newEdit.col = "bug";
        newEdit.op = "update";
        newEdit.target = { bugId };
        newEdit.update = updatedBug;
        auth = req.auth;
        await addEdit(newEdit);

      }
    }
    else if (hasPermission('canEditMyBug') === true && updatedBug.createdBy === req.auth.userId) {
      if (validId('bugId') === false) {
        res.status(400).send({ error: validateResult.error });
      }
      if (validBody(classifyBugSchema) === false) {
        res.status(400).send({ error: validateResult.error });
      }
      else {
        const updatedBug = await GetBugById(bugId);
        updatedBug.classification = classification;
        updatedBug.classifiedOn = new Date();
        updatedBug.classifiedBy = req.auth.userId;
        updatedBug.lastUpdated = new Date();

        const result = await updateBug(bugId, updatedBug);
        res.status(200).json({ message: 'Bug Classified' });
        debugBug(`Bug Classified: ${JSON.stringify(result)}`);

        //Log edit
        let newEdit = {};
        debugBug(`New Edit: ${JSON.stringify(newEdit)}`);
        newEdit.timestamp = new Date();
        newEdit.col = "bug";
        newEdit.op = "update";
        newEdit.target = { bugId };
        newEdit.update = updatedBug;
        auth = req.auth;
        await addEdit(newEdit);

      }
    }
    else {
      res.status(401).json({ message: `User not authorized` });
    }
  } catch (error) {
    debugBug(`Error: ${error}`);
    res.status(500).send(error);
  }
});

router.patch('/:id/assign', validId('bugId'), validId('assignedToUserId'), validBody(assignBugSchema), async (req, res) => {
  debugBug(`Program is running`);
  const bugId = req.params.id;
  const assignedToUserId = req.body.assignedToUserId;
  try {
    if (hasPermission('canEditAnyBug') === true) {
      if (validId('bugId') === false) {
        res.status(400).send({ error: validateResult.error });
      }
      if (validId('assignedToUserId') === false) {
        res.status(400).send({ error: validateResult.error });
      }
      else if (validBody(assignBugSchema) === false) {
        res.status(400).send({ error: validateResult.error });
      }
      else {
        const updatedBug = await GetBugById(bugId);
        updatedBug.assignedToUserId = assignedToUserId;
        updatedBug.assignedToUserName = GetUserById(assignedToUserId).fullName;
        updatedBug.assignedOn = new Date();
        updatedBug.assignedBy = req.auth.userId;
        updatedBug.lastUpdated = new Date();

        const result = await updateBug(bugId, updatedBug);
        res.status(200).json({ message: `Bug ${bugId} Assigned!` });
        debugBug(`Bug Assigned: ${JSON.stringify(result)}`);

        //Log edit
        let newEdit = {};
        debugBug(`New Edit: ${JSON.stringify(newEdit)}`);
        newEdit.timestamp = new Date();
        newEdit.col = "bug";
        newEdit.op = "update";
        newEdit.target = { bugId };
        newEdit.update = updatedBug;
        auth = req.auth;
        await addEdit(newEdit);
      }
    }
    else if (hasPermission('canEditIfAssignedTo') === true && updatedBug.assignedToUserId === req.auth.userId) {
      if (validId('bugId') === false) {
        res.status(400).send({ error: validateResult.error });
      }
      if (validId('assignedToUserId') === false) {
        res.status(400).send({ error: validateResult.error });
      }
      else if (validBody(assignBugSchema) === false) {
        res.status(400).send({ error: validateResult.error });
      }
      else {
        const updatedBug = await GetBugById(bugId);
        updatedBug.assignedToUserId = assignedToUserId;
        updatedBug.assignedToUserName = GetUserById(assignedToUserId).fullName;
        updatedBug.assignedOn = new Date();
        updatedBug.assignedBy = req.auth.userId;
        updatedBug.lastUpdated = new Date();

        const result = await updateBug(bugId, updatedBug);
        res.status(200).json({ message: `Bug ${bugId} Assigned!` });
        debugBug(`Bug Assigned: ${JSON.stringify(result)}`);

        //Log edit
        let newEdit = {};
        debugBug(`New Edit: ${JSON.stringify(newEdit)}`);
        newEdit.timestamp = new Date();
        newEdit.col = "bug";
        newEdit.op = "update";
        newEdit.target = { bugId };
        newEdit.update = updatedBug;
        auth = req.auth;
        await addEdit(newEdit);
      }
    }
    else if (hasPermission('canEditMyBug') === true && updatedBug.createdBy === req.auth.userId) {
      if (validId('bugId') === false) {
        res.status(400).send({ error: validateResult.error });
      }
      if (validId('assignedToUserId') === false) {
        res.status(400).send({ error: validateResult.error });
      }
      else if (validBody(assignBugSchema) === false) {
        res.status(400).send({ error: validateResult.error });
      }
      else {
        const updatedBug = await GetBugById(bugId);
        updatedBug.assignedToUserId = assignedToUserId;
        updatedBug.assignedToUserName = GetUserById(assignedToUserId).fullName;
        updatedBug.assignedOn = new Date();
        updatedBug.assignedBy = req.auth.userId;
        updatedBug.lastUpdated = new Date();

        const result = await updateBug(bugId, updatedBug);
        res.status(200).json({ message: `Bug ${bugId} Assigned!` });
        debugBug(`Bug Assigned: ${JSON.stringify(result)}`);

        //Log edit
        let newEdit = {};
        debugBug(`New Edit: ${JSON.stringify(newEdit)}`);
        newEdit.timestamp = new Date();
        newEdit.col = "bug";
        newEdit.op = "update";
        newEdit.target = { bugId };
        newEdit.update = updatedBug;
        auth = req.auth;
        await addEdit(newEdit);
      }
    }
    else {
      res.status(401).json({ message: `User not authorized` });
    }
  } catch (error) {
    debugBug(`Error: ${error}`);
    res.status(500).send(error);
  }
});

router.patch('/:id/close', validId('bugId'), validBody(closeBugSchema), hasPermission('canCloseAnyBug'), async (req, res) => {
  debugBug(`Program is running`);
  const bugId = req.params.id;
  if (req.auth) {
    try {
      if (validId('bugId') === false) {
        res.status(400).send({ error: validateResult.error });
      }
      else if (validBody(closeBugSchema) === false) {
        res.status(400).send({ error: validateResult.error });
      }
      else {
        const updatedBug = await GetBugById(bugId);
        updatedBug.closed = true;
        updatedBug.closedOn = new Date();
        updatedBug.closedBy = req.auth.userId;
        // if (closed === false) {
        //   updatedBug.closedOn = null;
        //   updatedBug.closedBy = null;
        // }
        updatedBug.lastUpdated = new Date();

        const result = await updateBug(bugId, updatedBug);
        debugBug(`Bug Closed: ${JSON.stringify(result)}`);

        //Log edit
        let newEdit = {};
        debugBug(`New Edit: ${JSON.stringify(newEdit)}`);
        newEdit.timestamp = new Date();
        newEdit.col = "bug";
        newEdit.op = "update";
        newEdit.target = { bugId };
        newEdit.update = updatedBug;
        //auth = req.auth;
        await addEdit(newEdit);
        res.status(200).json({ message: `Bug ${bugId} closed!` });
      }
    } catch (error) {
      debugBug(`Error: ${error}`);
      res.status(500).send(error);
    }
  }
  else {
    debugBug(req.auth);
    res.status(401).json({ message: `User not logged in` });
  }
});

//Comments
router.get('/:bugId/comments', validId('bugId'), hasPermission('canViewData'), async (req, res) => {
  debugBug('Comment list route hit');
  const bugId = req.params.bugId;
  if (validId('bugId') === false) {
    res.status(400).send({ error: validateResult.error });
  }
  else {
    const bug = await GetBugById(bugId);
    let comments = [];
    if (bug.comments) {
      for (let i = 0; i < bug.comments.length; i++) {
        let comment = await GetCommentById(bug.comments[i]);
        comments[i] = comment;
        console.log(`Comment ${i}: ${JSON.stringify(comment)}`);
      }
    }
    res.status(200).json(comments);
  }
});

router.get('/:bugId/comments/:commentId', validId('bugId'), validId('commentId'), hasPermission('canViewData'), async (req, res) => {
  debugBug('Get by ID route hit');
  const commentId = req.params.commentId;
  if (validId('bugId') === false || validId('commentId') === false) {
    res.status(400).send({ error: validateResult.error });
  }
  else {
    const comment = await GetCommentById(commentId);
    res.status(200).json(comment);
  }
});

router.post('/:bugId/comments', validId('bugId'), validBody(newCommentSchema), hasPermission('canAddComment'), async (req, res) => {
  const bugId = req.params.bugId;
  const newComment = req.body;
  try {
    newComment._id = new ObjectId();
    const userId = req.auth.userId;

    newComment.commentedOn = new Date();
    newComment.addedBy = userId;
    debugBug(`(bug.js) Valid Object`);
    //Getting stuck here
    console.log("Made it to await addComment");
    const commentResult = await addComment(bugId, newComment);
    debugBug(`New Comment Added: ${JSON.stringify(commentResult)}`);
    res.status(201).json({ message: `New Comment Added` });
  }
  catch (error) {
    debugBug(`Error: ${error}`);
    res.status(500).send(error);
  }
});

//Test Cases
router.get('/:bugId/tests', validId('bugId'), hasPermission('canViewData'), async (req, res) => {
  debugBug('Test list route hit');
  const bugId = req.params.bugId;
  if (validId('bugId') === false) {
    res.status(400).send({ error: validateResult.error });
  }
  else {
    const bug = await GetBugById(bugId);
    let testCases = [];
    if (bug.testCase) {
      for (let i = 0; i < bug.testCase.length; i++) {
        let testCase = await GetTestCaseById(bug.testCase[i]);
        testCases[i] = testCase;
      }
    }
    res.status(200).json(testCases);
  }
});

router.get('/:bugId/tests/:testId', validId('bugId'), validId('testId'), hasPermission('canViewData'), async (req, res) => {
  const bugId = req.params.bugId;
  try {
    debugBug('Get by ID route hit');
    const testId = req.params.testId;
    if (validId('bugId') === false || validId('testId') === false) {
      res.status(400).send({ error: validateResult.error });
    }
    else {
      const testCase = await GetTestCaseById(testId);
      res.status(200).json(testCase);
    }
  }
  catch (error) {
    debugBug(`Error: ${error}`);
    res.status(500).send(error);
  }
});

router.post('/:bugId/tests', validId('bugId'), validBody(newTestCaseSchema), hasPermission('canAddTestCase'), async (req, res) => {
  const bugId = req.params.bugId;
  const newTestCase = req.body;
  try {
    newTestCase._id = new ObjectId();
    newTestCase.commentedOn = new Date();
    debugBug(`(bug.js) Valid Object`);

    const bug = await GetBugById(bugId);
    if (bug.testCase) {
      bug.testCase.push(newTestCase._id);
    }
    else {
      bug.testCase = [newTestCase._id];
    }
    await updateBug(bugId, bug);
    debugBug(`Bug Updated: ${JSON.stringify(bug)}`);

    const testCaseResult = await addTestCase(newTestCase);
    debugBug(`New Comment Added: ${JSON.stringify(testCaseResult)}`);
    res.status(201).json({ message: `New Test Case Added` });
  }
  catch (error) {
    debugBug(`Error: ${error}`);
    res.status(500).send(error);
  }
});

router.patch('/:bugId/tests/:testId', validId('bugId'), validId('testId'), validBody(updateTestCaseSchema), hasPermission('canEditTestCase'), async (req, res) => {
  const bugId = req.params.bugId;
  const testId = req.params.testId;
  try {
    const updatedTestCase = req.body;
    if (validId('bugId') === false || validId('testId') === false) {
      res.status(400).send({ error: validateResult.error });
    }
    else if (JSON.stringify(updatedTestCase) === '{}') {
      res.status(400).json({ message: `Invalid request` });
    }
    else if (validBody(updateTestCaseSchema) === false) {
      res.status(400).send({ error: validateResult.error });
    }
    else {
      updatedTestCase.lastUpdatedOn = new Date();
      updatedTestCase.lastUpdatedBy = req.auth.userId;
      const result = await updateTestCase(testId, updatedTestCase);
      res.status(200).json({ message: 'Test Case Updated', result });

      //Log edit
      let newEdit = {};
      debugBug(`New Edit: ${JSON.stringify(newEdit)}`);
      newEdit.timestamp = new Date();
      newEdit.col = "test case";
      newEdit.op = "update";
      newEdit.target = { bugId };
      newEdit.update = updatedTestCase;
      auth = req.auth;
      await addEdit(newEdit);
    }

  }
  catch (error) {
    debugBug(`Error: ${error}`);
    res.status(500).send(error);
  }
});

router.delete('/:bugId/tests/:testId', validId('bugId'), validId('testId'), hasPermission('canEditTestCase'), async (req, res) => {
  const testId = req.params.id;
  const bugId = req.params.bugId;
  const bug = await GetBugById(bugId);
  deleteTestCase(testId).then((result) => {
    if (validId('testId') === false) {
      res.status(400).send({ error: validateResult.error });
    }
    else if (result.deletedCount === 0) {
      res.status(404).send({ error: `testId ${testId} is not a valid ObjectId.` });
    }
    else {
      bug.testCase = bug.testCase.filter((test) => test !== testId);
      res.status(200).json({ message: `Test deleted!`, testId });

      //Log edit
      let newEdit = {};
      debugBug(`New Edit: ${JSON.stringify(newEdit)}`);
      newEdit.timestamp = new Date();
      newEdit.col = "test case";
      newEdit.op = "delete";
      newEdit.target = { testId };
      newEdit.auth = req.auth;
      addEdit(newEdit);
    }
  })
});

export { router as bugRouter };