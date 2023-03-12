const Router = require('express').Router;
// const { verifySession } = require('../../helpers/auth');

// Controllers
const authController = require('../controllers/auth.controller');

const routes = new Router();

routes.post('/login', authController.login);
routes.post('/sign-up', authController.signup);

module.exports = routes;
