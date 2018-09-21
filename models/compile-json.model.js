'use strict';

// TODO: long and short data compile via option

const fs = require('fs');
const path = require('path');
const redis = require('./redis');

const dataFilePath = path.resolve(__dirname, '../data/');

const compileJson = async () => {
  const data = {};
  const keys = await redis.keys(`${global.redisPrefix}-pixel-*`);
  const pipeline = redis.pipeline();
  keys.forEach(key => pipeline.hgetall(key, (err, res) => {
    const coords = key.split('-');
    const lat    = coords[coords.length - 2];
    const long   = coords[coords.length - 1];
    data[lat] = data[lat] || [];
    data[lat].push({ [long]: res });
  }));
  await pipeline.exec();
  await fs.writeFile(dataFilePath + 'data-long.js', JSON.stringify(data), 'utf8', err => {
    if (err) throw err;
  });
};

module.exports = compileJson;
