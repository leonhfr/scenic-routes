'use strict';

const interestsModel = require('../models/interests.model');

module.exports.compileHeatmap = async (ctx, next) => {
  // TODO: options for long and short json
  ctx.body = await interestsModel.compileHeatmap();
  ctx.status = 200;
};

module.exports.buildDatabase = async (ctx, next) => {
  // TODO: options for dates in body
  // TODO: store options in db
  // TODO: option to flush db in body
  const success = await interestsModel.buildDatabase(false);
  if (success) {
    ctx.body = await interestsModel.getInterestsCount();
    ctx.status = 200;
  } else ctx.status = 500;
};

module.exports.buildInterests = async (ctx, next) => {
  // options:
  // - epsilon - neighborhood radius
  // - n pixels to create a cluster
  ctx.body = await interestsModel.buildInterests(12, 2);
  ctx.status = 200;
};

// module.exports.updateDatabase = async (ctx, next) => {
//   // TODO: get options from db
//   // TODO: update according to options
//   await interestsModel.updateDatabase();
//   ctx.status = 200;
// };
