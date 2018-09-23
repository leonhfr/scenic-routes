'use strict';

const boundsModel = require('../models/bounds.model');

module.exports.getBoundaries = async (ctx, next) => {
  ctx.body = await boundsModel.getBoundaries();
  ctx.status = 200;
};
