'use strict';

const routesModel = require('../models/routes.model');

module.exports.getRoutes = async (ctx, next) => {
  const coords = [
    ctx.params.alng,
    ctx.params.alat,
    ctx.params.blng,
    ctx.params.blat
  ].map(Number);
  ctx.body = await routesModel.getRoutes(...coords);
  ctx.status = 200;
};
