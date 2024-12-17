import express from 'express';
import debug from 'debug';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import { userRouter } from './routes/api/user.js';
import { bugRouter } from './routes/api/bug.js';
import { authMiddleware } from '@merlin4/express-auth';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
const app = express();
const port = process.env.PORT || 2024;
const debugServer = debug('app:Server');

// Middleware setup
app.use(cors());
app.use(cookieParser());
app.use(express.json()); // Ensure this is before your routes
app.use(express.urlencoded({ extended: true }));
app.use(express.static('frontend/dist'));

// Session and Passport setup
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: false,
    maxAge: 60 * 60 * 1000 // 1 hour
  }
}));

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:2024/api/users/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

app.use(passport.initialize());
app.use(passport.session());

app.use(authMiddleware(process.env.JWT_SECRET, 'authToken', {
  httpOnly: true,
  maxAge: 1000 * 60 * 60
}));

// Routes
app.use('/api/users', userRouter);
app.use('/api/bugs', bugRouter);

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'frontend', 'dist', 'index.html'));
});

app.get('/profile', (req, res) => {
  res.redirect('/api/users/profile');
});

app.get('/api', (req, res) => {
  res.send('Hello World from the back end route!');
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  debugServer(`Server is now running on port http://localhost:${port}`);
});