const express = require('express');
const bodyParser = require('body-parser');
let User = require('../models/user');
const router = express.Router();
const passport = require('passport');
const authenticate = require('../authenticate');
const cors = require('./cors');

router.use(bodyParser.json());

/* GET users listing. */
router.options('*', cors.corsWithOptions, (req, res) => {
  res.sendStatus(200);
});
router.get(
  '/',
  cors.cors,
  authenticate.verifyUser,
  authenticate.verifyAdmin,
  function(req, res, next) {
    User.find({})
      .then(
        users => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(users);
        },
        err => next(err)
      )
      .catch(err => next(err));
  }
);
// AFter the user is registered with the given username and password
// after success we will set the firstname and lastname
router.post('/signup', cors.corsWithOptions, (req, res, next) => {
  // mongoose plugin provides register
  // takes username as a parameter first then password
  User.register(
    new User({ username: req.body.username }),
    req.body.password,
    (err, user) => {
      if (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.json({ err: err });
      } else {
        if (req.body.firstname) user.firstname = req.body.firstname;
        if (req.body.lastname) user.lastname = req.body.lastname;
        user.save((err, user) => {
          if (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.json({ err: err });
            return;
          }
        });
        passport.authenticate('local')(req, res, () => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json({ success: true, status: 'Registration Successful!' });
        });
      }
    }
  );
});

router.post('/login', cors.corsWithOptions, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.json({ success: false, status: 'Login Unsuccessful!', err: info });
    }
    req.logIn(user, err => {
      if (err) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.json({
          success: false,
          status: 'Login Unsuccessful!',
          err: 'Could not log in user!'
        });
      }

      let token = authenticate.getToken({ _id: req.user._id });
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json({ success: true, status: 'Login Successful!', token: token });
    });
  })(req, res, next);
});
// Where is req.user comming from?
// It comes from passport.authenticate('local') when it successfully authenticates the user
// It will load up the user property onto the req.message

router.get('/logout', cors.cors, (req, res) => {
  if (req.session) {
    req.session.destroy();
    res.clearCookie('session-id');
    res.redirect('/');
  } else {
    var err = new Error('You are not logged in!');
    err.status = 403;
    next(err);
  }
});

router.get(
  '/facebook/token',
  passport.authenticate('facebook-token'),
  (req, res) => {
    if (req.user) {
      let token = authenticate.getToken({ _id: req.user._id });
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json({ success: true, token: token, status: 'Login Successful!' });
    }
  }
);

// router.get('/checkJWTtoken', cors.corsWithOptions, (req, res) => {
//   passport.authenticate('jwt', { session: false }, (err, user, info) => {
//     if (err) return next(err);

//     if (!user) {
//       res.statusCode = 401;
//       res.setHeader('Content-Type', 'application/json');
//       return res.json({ status: 'JWT invalid!', success: false, err: info });
//     } else {
//       res.statusCode = 200;
//       res.setHeader('Content-Type', 'application/json');
//       return res.json({ status: 'JWT valid!', success: true, user: user });
//     }
//   })(req, res);
// });

module.exports = router;
