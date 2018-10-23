'use strict';

const redis = require('./redis');
const buildDatabase = require('../services/build-database.service');
const buildInterests = require('../services/build-interests.service');
const compileHeatmap = require('../services/compile-heatmap.service');

module.exports.getInterestsCount = async () => {
  // TODO: move the count to a JSON file prop
  let count = 0;
  const keys = await redis.keys(`${process.env.REDIS_PREFIX}-pixel-*`);
  const pipeline = redis.pipeline();
  keys.forEach(key => pipeline.hget(key, 'pics', (err, res) => {
    count += parseInt(res);
  }));
  await pipeline.exec();
  return count;
};

// TODO: only get compiled JSON
module.exports.compileHeatmap = compileHeatmap;

module.exports.buildDatabase = buildDatabase;

module.exports.buildInterests = buildInterests;
