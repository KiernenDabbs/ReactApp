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

import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';  // Import dotenv
dotenv.config();  // Initialize dotenv

import { fetchRoles, mergePermissions, isLoggedIn, hasPermission } from '@merlin4/express-auth';

//Setup passport middleware
app.use(passport.initialize());
app.use(passport.session());

import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import e from 'express';
import bcrypt from 'bcrypt';
import Joi from 'joi';
import { validId } from '../../middleware/validId.js';
import { validBody } from '../../middleware/validBody.js';

import { connect, GetAllUsers } from '../../database.js';
import { GetUserById } from '../../database.js';
import { GetUserByEmail } from '../../database.js';
import { addUser, addEdit } from '../../database.js';
import { updateUser } from '../../database.js';
import { deleteUser } from '../../database.js';
import { GetUserEmail } from '../../database.js';
import { GetUserId } from '../../database.js';
import { CheckUserPassword } from '../../database.js';
import { GetRoleByName } from '../../database.js';

import { nanoid } from 'nanoid';
nanoid(24); //=> "CppNNOuTan3ylLLLKm6OGw"

import debug from 'debug';
const debugUser = debug('app:User');

//Schemas
const newUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  fullName: Joi.string().required(),
  givenName: Joi.string().required(),
  familyName: Joi.string().required(),
  role: Joi.string().valid('developer', 'business analyst', 'quality analyst', 'product manager', 'technical manager', 'user').required()
});

const loginUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const updateUserSchema = Joi.object({
  password: Joi.string(),
  fullName: Joi.string(),
  givenName: Joi.string(),
  familyName: Joi.string(),
  role: Joi.string().valid('developer', 'business analyst', 'quality analyst', 'product manager', 'technical manager', 'user')
});

//Issue Auth Token
async function issueAuthToken(user) {
  debugUser(`issueAuthToken route hit. User: ${JSON.stringify(user)}`);

  const roles = await fetchRoles(user, role => GetRoleByName(role));
  debugUser(roles);

  const permissions = mergePermissions(user, roles);
  debugUser(permissions);

  const token = await jwt.sign({ _id: user._id, email: user.email, role: user.role, permissions: permissions }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return token;
}

//Issue Auth Cookie
async function issueAuthCookie(res, token, userId) {
  debugUser(`issueAuthCookie route hit. User: ${userId}`);
  const cookieOptions = { httpOnly: true, maxAge: 1000 * 60 * 60, sameSite: 'strict' };
  res.cookie('authToken', token, cookieOptions);
  res.cookie('userId', userId, cookieOptions);
}

//List Users
router.get('', hasPermission('canViewData'), async (req, res) => {
  let { keywords, role, maxAge, minAge, sortBy, pageSize, pageNumber } = {};
  if (req.query) {
    ({ keywords, role, maxAge, minAge, sortBy, pageSize, pageNumber } = req.query);
  }
  try {
    debugUser(`User logged in: ${req.auth.email}`);
    const users = await GetAllUsers(keywords, role, maxAge, minAge, sortBy, pageSize, pageNumber);
    res.status(200).json(users);
  }
  catch (error) {
    res.status(500).json({ error: error.stack });
  }
});

//Get User by ID
router.get('/:id', validId('userId'), hasPermission('canViewData'), async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await GetUserById(userId);
    if (validId('userId') === false) {
    }
    else if (JSON.stringify(user) === '{}' || user === null) {
      res.status(404).json({ error: `userId ${userId} is not a valid ObjectId.` });
    }
    else {
      res.status(200).json(user);
    }

  } catch (error) {
    res.status(404).json({ error: `userId ${userId} is not a valid ObjectId.` });
  }
});

//Add User
router.post('', validBody(newUserSchema), async (req, res) => {
  //User who wants to register from the front end
  let newUser = {};
  // debugUser(`New User: ${JSON.stringify(newUser)}`);
  newUser.role = ['user'];
  const userId = new ObjectId();
  newUser.userId = userId;
  newUser = req.body;

  //Ensure the user is unique
  if (await GetUserEmail(newUser.email) === true) {
    res.status(400).json({ message: `Email already registered` });
  }
  else {
    newUser.createdOn = new Date();
    try {
      //Hash password
      newUser.password = await bcrypt.hash(newUser.password, 10);
      const result = await addUser(newUser);

      if (result.acknowledged) {
        //Generate JWT
        const authToken = await issueAuthToken(newUser);
        //Generate Auth Cookie
        await issueAuthCookie(res, authToken, userId);

        //Log edit
        let newEdit = {};
        debugUser(`New Edit: ${JSON.stringify(newEdit)}`);
        newEdit.timestamp = new Date();
        newEdit.col = "user";
        newEdit.op = "insert";
        newEdit.target = { userId };
        newEdit.update = newUser;
        await addEdit(newEdit);

        debugUser(`New User Added: ${JSON.stringify(result)}`);
        res.status(201).json({ message: 'User registered!', userId, authToken });
      }
      else {
        res.status(500).json({ message: `Error registering user` });
      }
    } catch (error) {
      debugUser(`Error: ${error}`);
      res.status(500).send(error);
    }
  }
});

//Login User
router.post('/login', validBody(loginUserSchema), async (req, res) => {
  try {
    if (validBody(loginUserSchema) === false) {
      res.status(400).send({ error: validateResult.error });
    }
    else {
      const user = await GetUserByEmail(req.body.email);
      if (user === null) {
        res.status(404).json({ message: `User not found` });
      }
      else if (await bcrypt.compare(req.body.password, user.password) === false) {
        res.status(401).json({ message: `Incorrect password` });
      }
      else {
        const userId = user._id;

        //Log In
        const authToken = await issueAuthToken(user);
        await issueAuthCookie(res, authToken, userId);

        res.status(200).json({ message: `Welcome Back!`, userId, authToken });
      }
    }
  }
  catch (error) {
    debugUser(`Error: ${error}`);
    res.status(500).send(error);
  }
});

// //Login user with google
router.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));
//Callback route for google to redirect to
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
  res.redirect('/profile');
});

//Display profile
app.get('/profile', async (req, res) => {
  if (req.isAuthenticated()) {
    res.send(`<h1>You are logged in</h1><span>${JSON.stringify(req.user, null, 2)}</span>`);
  }
  else {
    res.redirect('/');
  }
});

//Logout user
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      res.status(500).send(err);
    }
  });
  res.redirect('/');
});

//Update own user route
router.patch('/me', validBody(updateUserSchema), isLoggedIn(), async (req, res) => {
  const userId = req.auth._id;
  try {
    const currentUser = await GetUserById(req.auth._id);
    debugUser(`User ${JSON.stringify(currentUser)} update route hit`);
    if (validId('userId') === false) {
      res.status(400).send({ error: validateResult.error });
    }
    else if (validBody(updateUserSchema) === false) {
      res.status(400).send({ error: validateResult.error });
    }
    else {
      //const updatedUser = {...currentUser};
      if (req.body.password) {
        currentUser.password = await bcrypt.hash(req.body.password, 10);
      }
      if (req.body.fullName) {
        debugUser(`req.body.fullName: ${req.body.fullName}`);
        debugUser(`currentUser.fullName: ${currentUser.fullName}`);
        currentUser.fullName = req.body.fullName;
      }
      if (req.body.givenName) {
        currentUser.givenName = req.body.givenName;
      }
      if (req.body.familyName) {
        currentUser.familyName = req.body.familyName;
      }
      if (req.body.role) {
        currentUser.role = req.body.role;
      }
      currentUser.lastUpdated = new Date();
      currentUser.lastUpdatedBy = userId;
      try {
        debugUser(`Made it to the try-catch` + JSON.stringify(req.body));
        const result = await updateUser(userId, currentUser);
        res.status(200).json({ message: `User ${userId} updated` });

        //Log edit
        let newEdit = {};
        debugUser(`New Edit: ${JSON.stringify(newEdit)}`);
        newEdit.timestamp = new Date();
        newEdit.col = "user";
        newEdit.op = "update";
        newEdit.target = { userId };
        newEdit.update = currentUser;
        newEdit.auth = req.auth;
        addEdit(newEdit);

        //Log In
        const authToken = await issueAuthToken(user);
        await issueAuthCookie(res, authToken, userId);

        debugUser(`User ${userId} updated: ${JSON.stringify(result)}`);
      }
      catch (error) {
        res.status(500).send(error);
      }
    }
  }
  catch (error) {
    debugUser(`Error: ${error}`);
    res.status(500).send(error);
  }
});

//Update User
router.patch('/:id', validId('userId'), validBody(updateUserSchema), hasPermission('canEditAnyUser'), async (req, res) => {
  debugUser(`User update route hit`);
  const userId = req.params.id;
  //debugUser(`User ${id} update route hit`);
  const currentUser = await GetUserById(userId);

  const updatedUser = currentUser;
  if (req.body.password) {
    updatedUser.password = await bcrypt.hash(req.body.password, 10);
  }
  if (req.body.fullName) {
    updatedUser.fullName = req.body.fullName;
  }
  if (req.body.givenName) {
    updatedUser.givenName = req.body.givenName
  }
  if (req.body.familyName) {
    updatedUser.familyName = req.body.familyName;
  }
  if (req.body.role) {
    updatedUser.role = req.body.role;
  }
  updatedUser.lastUpdatedOn = new Date();
  updatedUser.lastUpdatedBy = req.auth.userId;
  try {
    //debugUser(`Made it to the try-catch`);
    const result = await updateUser(userId, updatedUser);

    //Log edit
    let newEdit = {};
    debugUser(`New Edit: ${JSON.stringify(newEdit)}`);
    newEdit.timestamp = new Date();
    newEdit.col = "user";
    newEdit.op = "update";
    newEdit.target = { userId };
    newEdit.update = updatedUser;
    newEdit.auth = req.auth;
    addEdit(newEdit);

    debugUser(`User ${userId} updated: ${JSON.stringify(result)}`);
    res.status(200).json({ message: `User ${userId} updated` });

  } catch (error) {
    res.status(500).send("Error: " + JSON.stringify(error));
    console.log("Error: " + JSON.stringify(error));
  }
});

//Delete User
router.delete('/:id', validId('userId'), hasPermission('canViewData'), async (req, res) => {
  const userId = req.params.id;
  deleteUser(userId).then((result) => {
    if (validId('userId') === false) {
      res.status(400).send({ error: validateResult.error });
    }
    else if (result.deletedCount === 0) {
      res.status(404).send({ error: `userId ${userId} is not a valid ObjectId.` });
    }
    else {
      //Log edit
      let newEdit = {};
      debugUser(`New Edit: ${JSON.stringify(newEdit)}`);
      newEdit.timestamp = new Date();
      newEdit.col = "user";
      newEdit.op = "delete";
      newEdit.target = { userId };
      newEdit.auth = req.auth;
      addEdit(newEdit);

      res.status(200).json({ message: `User ${userId} deleted!`, userId });
    }
  }
  )
});

export { router as userRouter };