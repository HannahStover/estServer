const express = require('express');
const bodyParser = require('body-parser');
const authenticate = require('../authenticate');
const cors = require('./cors');

const Clients = require('../models/clients'); // access to Schema

const clientRouter = express.Router(); // create route

clientRouter.use(bodyParser.json()); // read json with middleware

// client route

clientRouter
  .route('/')
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .all((req, res, next) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    next();
  })
  .get(
    cors.cors,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Clients.find(req.query)
        .then(
          clients => {
            res.json(clients);
          },
          err => next(err)
        )
        .catch(err => next(err));
    }
  )
  .post(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Clients.create(req.body)
        .then(
          client => {
            console.log('Client created: ', client);
            res.json(client);
          },
          err => next(err)
        )
        .catch(err => next(err));
    }
  )
  .put(
    cors.corsWithOptions,
    authenticate.verifyAdmin,
    authenticate.verifyUser,
    (res, req, next) => {
      res.statusCode = 403;
      res.end(`PUT operations not supported on /clients`);
    }
  )
  .delete(
    cors.corsWithOptions,
    authenticate.verifyAdmin,
    authenticate.verifyUser,
    (req, res, next) => {
      Clients.deleteOne({})
        .then(
          resp => {
            res.json(resp);
          },
          err => next(err)
        )
        .catch(err => next(err));
    }
  );

// Route to clientId
clientRouter
  .route('/:clientId')
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .all((req, res, next) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    next();
  })
  .get(cors.cors, (req, res, next) => {
    Clients.findById(req.params.clientId)
      .then(
        client => {
          res.json(client);
        },
        err => next(err)
      )
      .catch(err => next(err));
  })
  .post(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      res.statusCode = 403;
      res.end(
        `POST operation not supported on /clients/${req.params.clientId}`
      );
    }
  )
  .put(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Clients.findByIdAndUpdate(
        req.params.clientId,
        {
          $set: req.body
        },
        { new: true }
      )
        .then(
          client => {
            res.json(client);
          },
          err => next(err)
        )
        .catch(err => next(err));
    }
  )
  .delete(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Clients.findByIdAndRemove(req.params.clientId)
        .then(
          resp => {
            res.json(resp);
          },
          err => next(err)
        )
        .catch(err => next(err));
    }
  );

module.exports = clientRouter;
