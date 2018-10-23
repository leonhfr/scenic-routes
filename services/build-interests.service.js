'use strict';

const fs = require('fs');
const path = require('path');
const clustering = require('density-clustering');
const redis = require('../models/redis');
const turf = require('@turf/turf');

const idRedisMapFilePath = path.resolve(__dirname, '../data/id-redis-map.json');
const clustersFilePath = path.resolve(__dirname, '../data/clusters.json');
const rplotFilePath = path.resolve(__dirname, '../data/rplot.json');
const interestsRawFilePath = path.resolve(__dirname, '../data/interests-raw.json');
// const interestsFilterFilePath = path.resolve(__dirname, '../data/interests-filter.json');
const interestsFilePath = path.resolve(__dirname, '../data/interests.geo.json');

const buildInterests = async (epsilon, minPts) => {

  // eslint-disable-next-line
  console.log('*** Building interests from pixels ***');

  // 0: flush the db of interest
  // TODO: flush
  // eslint-disable-next-line
  console.log('Flushing Redis database (interests)...');
  const dbKeys = await redis.keys(`${process.env.REDIS_PREFIX}-interest-*`);
  const pipeline = redis.pipeline();
  dbKeys.forEach(key => pipeline.del(key));
  await pipeline.exec();

  // eslint-disable-next-line
  console.log(`Building clusters with epsilon = ${epsilon} and MinPts = ${minPts}`);

  // 1: build mapping
  const keys = await redis.keys(`${process.env.REDIS_PREFIX}-pixel-*`);
  const keysFile = JSON.stringify(keys);
  fs.writeFileSync(idRedisMapFilePath, keysFile, 'utf8');
  // eslint-disable-next-line
  console.log(`Processed ${keys.length} keys and saved them to a JSON file (${keysFile.length} bytes).`);

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
  const clustersFile = JSON.stringify(clusters);
  fs.writeFileSync(clustersFilePath, clustersFile, 'utf8');
  // eslint-disable-next-line
  console.log(`Computed ${clusters.length} clusters and saved them to a JSON file (${clustersFile.length} bytes).`);

  // 4: get reachability plot
  const rplot = optics.getReachabilityPlot();
  const rplotFile = JSON.stringify(rplot);
  fs.writeFileSync(rplotFilePath, rplotFile, 'utf8');
  // eslint-disable-next-line
  console.log(`Computed the reachability plot and saved it to a JSON file (${rplotFile.length} bytes).`);

  // 5: build interests objects and convert to geojson
  const interestsRaw = [];
  await Promise.all(clusters.map(async cluster => {
    const pixels = [];
    const coords = [];
    const clusterKeys = cluster.map(id => keys[id]);
    const pipeline = redis.pipeline();
    clusterKeys.forEach(key => pipeline.hgetall(key, (err, res) => {
      const crd = key.split('-');
      const lng = parseInt(crd[crd.length - 1]) / 100000;
      const lat = parseInt(crd[crd.length - 2]) / 100000;
      const pt = turf.point([lng, lat]);
      coords.push(pt);
      pixels.push(res);
    }));
    await pipeline.exec();

    const properties = {
      pics: 0,
      interest: Infinity,
      views: 0,
      id: '',
      urlc: '',
      urls: ''
    };
    let mostInteresting = Infinity;
    let mostViews = 0;
    // TODO: refactor with reduce

    pixels.forEach(pixel => {
      const pics = parseInt(pixel.pics);
      const views = parseInt(pixel.views);
      const interest = parseInt(pixel.interest);
      if (interest < mostInteresting || (
        interest === mostInteresting && views < mostViews
      )) {
        mostInteresting = interest;
        mostViews = views;
        properties.id = pixel.id;
        properties.urlc = pixel.urlc;
        properties.urls = pixel.urls;
      }
      properties.pics += pics;
      properties.views += views;
      properties.interest = Math.min(properties.interest, interest);
    });

    const points = turf.featureCollection(coords);
    const location = turf.getCoord(turf.centroid(points));
    const interest = turf.point(
      location,
      properties
    );

    // TODO: save it to the databse, does this work?
    const lat = Math.round(parseFloat(location[1]) * 100000);
    const lng = Math.round(parseFloat(location[0]) * 100000);
    const key = `${process.env.REDIS_PREFIX}-interest-${lat}-${lng}`;
    await redis.hmset(key, properties);

    interestsRaw.push(interest);
  }));
  const interestsRawFile = JSON.stringify(interestsRaw);
  fs.writeFileSync(interestsRawFilePath, interestsRawFile, 'utf8');
  // eslint-disable-next-line
  console.log(`Built the interests objects and saved them to a JSON file (${interestsRawFile.length} bytes).`);

  // 7: convert to geojson
  const interests = turf.featureCollection(interestsRaw);
  const interestsFile = JSON.stringify(interests);
  fs.writeFileSync(interestsFilePath, interestsFile, 'utf8');
  // eslint-disable-next-line
  console.log(`Converted interests to GeoJSON and saved them to a GeoJSON file (${interestsFile.length} bytes).`);

  // 10: return some stats
  const reduction = parseFloat((clusters.length / keys.length).toFixed(2));
  return {
    epsilon: e,
    MinPts: p,
    keys: keys.length,
    clusters: clusters.length,
    reduction
  };
};

module.exports = buildInterests;
