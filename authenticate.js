// To store the authentication strategies
const passport = require('passport');

// Module exports a strategy that we can use for our application
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/user');

// JSON Web Token Strategy provided by passport JWT node module
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken'); // used to create, sign and verify tokens

// Facebook Strategy
const FacebookTokenStrategy = require('passport-facebook-token');

// config.js
const config = require('./config');

exports.local = passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Calls a user json object and create the token
exports.getToken = function(user) {
  return jwt.sign(user, config.secretKey, { expiresIn: 3600 });
};

// Options to specify for JWT based strategy
let opts = {};
// how JWT should be extracted from incoming req message
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;

exports.jwtPassport = passport.use(
  new JwtStrategy(opts, (jwt_payload, done) => {
    console.log('JWT Payload: ', jwt_payload);
    User.findOne({ _id: jwt_payload._id }, (err, user) => {
      if (err) {
        return done(err, false);
      } else if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    });
  })
);

// verify incoming user
// how this works?
// Token will be included in the authentication header (line: 31);

exports.verifyUser = passport.authenticate('jwt', { session: false });

exports.verifyAdmin = (req, res, next) => {
  User.findById({ _id: req.user._id })
    .then(
      user => {
        if (user.admin == true) {
          console.log('This admin is a user', user.admin);
          next();
        } else {
          err = new Error('You are not an admin.');
          res.statusCode = 403;
          return next(err);
        }
      },
      err => next(err)
    )
    .catch(err => next(err));
};

exports.facebookPassport = passport.use(
  new FacebookTokenStrategy(
    {
      clientID: config.facebook.clientId,
      clientSecret: config.facebook.clientSecret
    },
    (accessToken, refreshToken, profile, done) => {
      User.findOne({ facebookId: profile.id }, (err, user) => {
        if (err) {
          return done(err, false);
        }
        if (!err && user !== null) {
          return done(null, user);
        } else {
          user = new User({ username: profile.displayName });
          user.facebookId = profile.id;
          user.firstname = profile.name.givenName;
          user.lastname = profile.name.familyName;
          user.save((err, user) => {
            if (err) return done(err, false);
            else return done(null, user);
          });
        }
      });
    }
  )
);
