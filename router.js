'use strict';

const authMiddleware = require('./middlewares/authorization');

const boundsController = require('./controllers/bounds.controller');
const interestsController = require('./controllers/interests.controller');
const routesController   = require('./controllers/routes.controller');

const router = require('koa-router')();

// TODO: remove refactor
router.get('/routes/:alng/:alat/:blng/:blat', routesController.getRoutes);
router.get('/routes2/:alng/:alat/:blng/:blat', routesController.getRoutes2);

router.get('/map/boundaries', boundsController.getBoundaries);

router.get('/interests/compile/heatmap', authMiddleware, interestsController.compileHeatmap);
router.post('/interests/build/database', authMiddleware, interestsController.buildDatabase);
router.post('/interests/build/interests', authMiddleware, interestsController.buildInterests);

module.exports = router;
