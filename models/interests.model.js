'use strict';

const redis = require('./redis');
const buildDatabase = require('./build-database.model');
const compileJson = require('./compile-json.model');

module.exports.getInterestsCount = async () => {
  // TODO: move the count to a JSON file prop
  let count = 0;
  const keys = await redis.keys(`${global.redisPrefix}-pixel-*`);
  const pipeline = redis.pipeline();
  keys.forEach(key => pipeline.hget(key, 'score', (err, res) => {
    count += parseInt(res);
  }));
  await pipeline.exec();
  return count;
};

module.exports.getInterests = async () => {
  // eslint-disable-next-line
  console.log('get interests');
  // TODO: only get compiled JSON
  const res = await compileJson();
  return res;
};

module.exports.buildDatabase = buildDatabase;

module.exports.updateDatabase = async () => {
  // eslint-disable-next-line
  console.log('update databse');
};
