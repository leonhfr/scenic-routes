'use strict';

const interestsModel = require('../models/interests.model');

module.exports.getInterests = async (ctx, next) => {
  // options for long and short json
  // TODO: delete route (static serve)
  ctx.body = await interestsModel.getInterests();
  ctx.status = 200;
};

module.exports.buildDatabase = async (ctx, next) => {
  // TODO: options for dates in body
  // TODO: store options in db
  // TODO: option to flush db in body
  const success = await interestsModel.buildDatabase(true);
};

module.exports.updateDatabase = async (ctx, next) => {
  // TODO: get options from db
  // TODO: update according to options
  await interestsModel.updateDatabase();
  ctx.status = 200;
};
