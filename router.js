'use strict';

const authMiddleware = require('./middlewares/authorization');

const interestsController = require('./controllers/interests.controller');
const routesController   = require('./controllers/routes.controller');

const router = require('koa-router')();

router.get('/interests', interestsController.getInterests);
router.post('/interests/build', authMiddleware, interestsController.buildDatabase);
router.post('/interests/update', authMiddleware, interestsController.updateDatabase);

module.exports = router;
