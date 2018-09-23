'use strict';

const authMiddleware = require('./middlewares/authorization');

const boundsController = require('./controllers/bounds.controller');
const interestsController = require('./controllers/interests.controller');
const routesController   = require('./controllers/routes.controller');

const router = require('koa-router')();

router.get('/map/boundaries', boundsController.getBoundaries);

router.get('/interests/compile/heatmap', authMiddleware, interestsController.compileHeatmap);
router.post('/interests/build/database', authMiddleware, interestsController.buildDatabase);
router.post('/interests/build/clusters', authMiddleware, interestsController.buildClusters);

module.exports = router;
