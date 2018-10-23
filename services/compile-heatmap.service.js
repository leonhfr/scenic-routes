'use strict';

const fs = require('fs');
const path = require('path');
const turf = require('@turf/turf');
const redis = require('../models/redis');

const dataFilePath = path.resolve(__dirname, '../data/heatmap.geo.json');

const compileHeatmap = async () => {
  const features = [];
  const keys = await redis.keys(`${process.env.REDIS_PREFIX}-pixel-*`);
  const pipeline = redis.pipeline();
  keys.forEach(key => pipeline.hmget(key, 'pics', (err, res) => {
    const coords = key.split('-');
    const lat    = parseInt(coords[coords.length - 2]) / 100000;
    const long   = parseInt(coords[coords.length - 1]) / 100000;
    const feature = turf.point(
      [ long, lat ],
      { score: Number(res[0]) }
    );
    features.push(feature);
  }));
  await pipeline.exec();
  const data = turf.featureCollection(features);
  const geojson = JSON.stringify(data);
  await fs.writeFile(dataFilePath, geojson, 'utf8', err => {
    if (err) throw err;
  });
  return `Compiled to a ${geojson.length} bytes GeoJSON file.`;
};

module.exports = compileHeatmap;
