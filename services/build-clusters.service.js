'use strict';

const fs = require('fs');
const path = require('path');
const clustering = require('density-clustering');
const redis = require('../models/redis');

const idRedisMapFilePath = path.resolve(__dirname, '../data/id-redis-map.json');
const clustersFilePath = path.resolve(__dirname, '../data/clusters.json');
const rplotFilePath = path.resolve(__dirname, '../data/rplot.json');

const buildClusters = async (epsilon, minPts) => {
  // eslint-disable-next-line
  console.log(`Building clusters with epsilon = ${epsilon} and MinPts = ${minPts}`);
  // 1: build mapping
  const keys = await redis.keys(`${global.redisPrefix}-pixel-*`);
  fs.writeFileSync(idRedisMapFilePath, JSON.stringify(keys), 'utf8');
  // eslint-disable-next-line
  console.log(`Processed ${keys.length} keys and saved them to a JSON file.`);
  // 2: build dataset
  const dataset = [];
  keys.forEach(key => {
    const coords = key.split('-');
    const long   = parseInt(coords[coords.length - 1]) / 100000;
    const lat    = parseInt(coords[coords.length - 2]) / 100000;
    dataset.push([long, lat]);
  });
  // eslint-disable-next-line
  console.log('Built the dataset for clustering');
  // 3: create clusters
  const e = epsilon / 100000;
  const p = minPts;
  const optics = new clustering.OPTICS();
  const clusters = optics.run(dataset, e, p);
  fs.writeFileSync(clustersFilePath, JSON.stringify(clusters), 'utf8');
  // eslint-disable-next-line
  console.log(`Computed ${clusters.length} clusters and saved them to a JSON file.`);
  // 4: get reachability plot
  const rplot = optics.getReachabilityPlot();
  fs.writeFileSync(rplotFilePath, JSON.stringify(rplot), 'utf8');
  // eslint-disable-next-line
  console.log(`Computed the reachability plot and saved it to a JSON file.`);
  // 5: return some stats
  const reduction = parseFloat((clusters.length / keys.length).toFixed(2));
  return {
    epsilon: e,
    MinPts: p,
    keys: keys.length,
    clusters: clusters.length,
    reduction
  };
};

// const features = [];
// const keys = await redis.keys(`${global.redisPrefix}-pixel-*`);
// const pipeline = redis.pipeline();
// keys.forEach(key => pipeline.hmget(key, 'pics', (err, res) => {
//   const coords = key.split('-');
//   const lat    = parseInt(coords[coords.length - 2]) / 100000;
//   const long   = parseInt(coords[coords.length - 1]) / 100000;
//   const feature = turfHelpers.point(
//     [ long, lat ],
//     { score: Number(res[0]) }
//   );
//   features.push(feature);
// }));
// await pipeline.exec();
// const data = turfHelpers.featureCollection(features);
// const geojson = JSON.stringify(data);
// await fs.writeFile(dataFilePath, geojson, 'utf8', err => {
//   if (err) throw err;
// });
// return `Compiled to a ${geojson.length} bytes GeoJSON file.`;

module.exports = buildClusters;

// module.exports.getInterestsCount = async () => {
//   // TODO: move the count to a JSON file prop
//   let count = 0;
//   const keys = await redis.keys(`${global.redisPrefix}-pixel-*`);
//   const pipeline = redis.pipeline();
//   keys.forEach(key => pipeline.hget(key, 'pics', (err, res) => {
//     count += parseInt(res);
//   }));
//   await pipeline.exec();
//   return count;
// };
