'use strict';

// TODO: remove refactor
const routesModel = require('../models/routes.model');
const routesModel2 = require('../models/routes2.model');

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

module.exports.getRoutes2 = async (ctx, next) => {
  const coords = [
    ctx.params.alng,
    ctx.params.alat,
    ctx.params.blng,
    ctx.params.blat
  ].map(Number);
  ctx.body = await routesModel2.getRoutes(...coords);
  ctx.status = 200;
};
