'use strict';

const axios = require('axios');
const redis = require('./redis');
const turf = require('@turf/turf');

const mapboxAPI = 'https://api.mapbox.com/directions/v5';

module.exports.getRoutes = async (alng, alat, blng, blat) => {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  const res = await axios.get(`${mapboxAPI}/mapbox/walking/${alng},${alat};${blng},${blat}?geometries=geojson&access_token=${token}`);
  const origRoute = turf.lineString(res.data.routes[0].geometry.coordinates);
  const distanceTravelled = res.data.routes[0].distance;
  const keys = await redis.keys(`${global.redisPrefix}-interest-*`);
  const distances = keys.map(rkey => {
    const coords = rkey.split('-');
    const lat    = parseInt(coords[coords.length - 2]) / 100000;
    const lng    = parseInt(coords[coords.length - 1]) / 100000;
    const point  = turf.point([lng, lat]);
    const dist   = turf.nearestPointOnLine(origRoute, point);
    return {
      dist,
      key: (coords[coords.length - 2] + '-' + coords[coords.length - 1])
    };
  });
  const interestsDist = distances.filter(dist => {
    return (dist.dist.properties.dist < 0.3);
  });
  const interests = [];
  const pipeline = redis.pipeline();
  interestsDist.forEach(dist =>
    pipeline.hgetall(`${global.redisPrefix}-interest-${dist.key}`, (err, res) => {
      interests.push({
        key: dist.key,
        ...res,
        dist: dist.dist.properties.dist
      });
    }));
  await pipeline.exec();
  const ints = interests.sort((a, b) => {
    return a.interest - b.interest;
  }).slice(0, 10);
  // TODO: sort by interest, pics, views
  const n = 2 + Math.floor(Math.random() * Math.floor(2));
  // TODO: number function of distance travelled
  const random = ints.pickRandoms(n);
  // TODO: first select 3 random ones in the top10
  // TODO: format the route again, with interests data
  // TODO: return new route
  return random;
};

Array.prototype.pickRandoms = function (n) {
  // TODO: pick some stuff
  let array = this.slice();
  const randomIndex = (len) => {
    return Math.floor(Math.random() * Math.floor(len));
  };
  const picked = [];
  for (let i = 0; i < n; i++) {
    const pick = randomIndex(array.length);
    picked.push(array[pick]);
    array.splice(pick, 1);
  }
  return picked;
};

// TODO: select interests based on quality
// TODO: select interests based on added time travel
