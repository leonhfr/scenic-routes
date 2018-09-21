'use strict';

// TODO: long and short data compile via option
// TODO: compile to geoJSON

const fs = require('fs');
const path = require('path');
const redis = require('../models/redis');

const dataFilePath = path.resolve(__dirname, '../data/data-long.json');

const compileJson = async () => {
  const data = {
    type: 'FeatureCollection',
    features: []
  };
  const keys = await redis.keys(`${global.redisPrefix}-pixel-*`);
  const pipeline = redis.pipeline();
  keys.forEach(key => pipeline.hgetall(key, (err, res) => {
    const coords = key.split('-');
    const lat    = coords[coords.length - 2] / 10000;
    const long   = coords[coords.length - 1] / 10000;

    if (res.score > 1) data.features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [long, lat]
      },
      properties: {
        score: parseInt(res.score),
      //   id: parseInt(res.id),
      //   url: res.url,
      //   size: res.size
      }
    });

  }));
  await pipeline.exec();
  await fs.writeFile(dataFilePath, JSON.stringify(data), 'utf8', err => {
    if (err) throw err;
  });
};

module.exports = compileJson;
