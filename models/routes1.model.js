'use strict';

const turf = require('@turf/turf');
const redis = require('./redis');
const mapboxService = require('../services/mapbox.service');

const axios = require('axios');
const mapboxAPI = 'https://api.mapbox.com/directions/v5';
const token = process.env.MAPBOX_ACCESS_TOKEN;

module.exports.getRoutes = async (alng, alat, blng, blat) => {
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
    return (dist.dist.properties.dist < 0.1);
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
  // number function of distance travelled
  const target = Math.ceil(distanceTravelled / 500) +
    Math.floor(Math.random() * Math.floor(distanceTravelled / 500));
  const ints = interests.sort((a, b) => {
    return a.interest - b.interest;
  }).slice(0, 2* target);
  // sort by interest, pics, views
  // eslint-disable-next-line
  // console.log(target);
  const random = ints.pickRandoms(target);
  // TODO: order waypoints according to distances

  const route = [];
  // AFTER THIS THE CODE BECOMES SHIT (before too actually)
  // find first let
  const firstLeg = {
    id: 0,
    distance: Infinity
  };
  // TODO: sometimes key is undefined
  for (let i = 0; i < random.length; i++) {
    const waypointCoords = random[i].key.split('-');
    const lng = parseInt(waypointCoords[waypointCoords.length - 1]) / 100000;
    const lat = parseInt(waypointCoords[waypointCoords.length - 2]) / 100000;
    const res = await axios.get(`${mapboxAPI}/mapbox/walking/${alng},${alat};${lng},${lat}?geometries=geojson&access_token=${token}`);
    const distance = res.data.routes[0].distance;
    if (distance < firstLeg.distance) {
      firstLeg.id = i;
      firstLeg.distance = distance;
    }
  }
  route.push(random[firstLeg.id]);
  random.splice(firstLeg.id, 1);

  // now order the waypoints with the first
  while (random.length) {
    const mem = {
      id: 0,
      distance: Infinity
    };
    for (let i = 0; i < random.length; i++) {
      const waypointCoords = random[i].key.split('-');
      const lng = parseInt(waypointCoords[waypointCoords.length - 1]) / 100000;
      const lat = parseInt(waypointCoords[waypointCoords.length - 2]) / 100000;
      const res = await axios.get(`${mapboxAPI}/mapbox/walking/${alng},${alat};${lng},${lat}?geometries=geojson&access_token=${token}`);
      const distance = res.data.routes[0].distance;
      if (distance < firstLeg.distance) {
        mem.id = i;
        mem.distance = distance;
      }
    }
    route.push(random[mem.id]);
    random.splice(mem.id, 1);
  }

  // route is ordered, let's get the new route

  const waypoints = [];
  for (let r of route) {
    const waypointCoords = r.key.split('-');
    const lng = parseInt(waypointCoords[waypointCoords.length - 1]) / 100000;
    const lat = parseInt(waypointCoords[waypointCoords.length - 2]) / 100000;
    waypoints.push(`${lng},${lat}`);
  }
  const waypointsRoute = waypoints.join(';');

  const finalRouteReq = await axios.get(`${mapboxAPI}/mapbox/walking/${alng},${alat};${waypointsRoute};${blng},${blat}?geometries=geojson&access_token=${token}`);
  const finalRouteData = finalRouteReq.data.routes[0];
  // TODO: format the route again, with interests data
  // TODO: return new route

  // now the code becomes a bit better
  const finalLine = turf.lineString(
    finalRouteData.geometry.coordinates,
    { forLayer: 'line' }
  );
  const start = turf.point(
    finalRouteReq.data.waypoints[0].location,
    {
      forLayer: 'startend',
      name: finalRouteReq.data.waypoints[0].name
    }
  );
  const end = turf.point(
    finalRouteReq.data.waypoints[finalRouteReq.data.waypoints.length - 1].location,
    {
      forLayer: 'startend',
      name: finalRouteReq.data.waypoints[finalRouteReq.data.waypoints.length - 1].name
    }
  );

  const interestsGeometry = [];
  for (let i = 0; i < route.length; i++) {
    interestsGeometry.push(turf.point(
      finalRouteReq.data.waypoints[i+1].location,
      {
        forLayer: 'interests',
        name: finalRouteReq.data.waypoints[i+1].name,
        ...route[i]
      }
    ));
  }

  const geometry = turf.featureCollection([
    finalLine,
    start,
    end,
    ...interestsGeometry
  ]);

  const { legs, duration, distance } = finalRouteData;
  const dataToSendBack = {
    legs, duration, distance
  };

  return {
    geometry,
    data: dataToSendBack
  };
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
