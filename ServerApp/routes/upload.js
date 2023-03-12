const Router = require('express').Router;
const routes = new Router();

// Controllers
const uploadController = require('../controllers/upload.controller');
routes.post('/urltrack', uploadController.urltrack);
routes.post('/urlidlestate', uploadController.urlidlestate);
routes.get('/getcurrentidlestate', uploadController.getcurrentidlestate);

module.exports = routes;