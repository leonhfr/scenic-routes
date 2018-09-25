'use strict';

const turf = require('@turf/turf');
const redis = require('./redis');
const mapboxService = require('../services/mapbox.service');

module.exports.getRoutes = async (alng, alat, blng, blat) => {
  // DEFINING CONSTANTS AND HELPERS
  const startEndCoords = [alng, alat, blng, blat];
  const getShortestRoute = async (coords) => {
    const route    = await mapboxService('directions', coords);
    const polyline = turf.lineString(route.routes[0].geometry.coordinates);
    const distance = route.routes[0].distance;
    return {
      polyline,
      distance
    };
  };
  const computeBoundingBox = (polyline, offset) => {
    let [minX, minY, maxX, maxY] = turf.bbox(shortestRoute.polyline);
    [minX, minY, maxX, maxY] =
      [minX - offset, minY - offset, maxX + offset, maxY + offset];
    const line = turf.lineString([
      [minX, minY],
      [minX, maxY],
      [maxX, minY],
      [maxX, maxY]
    ]);
    const poly = turf.lineToPolygon(line);
    return poly;
  };
  const makeCoordsFromKeys = keys => keys.map(key => {
    const crd = key.split('-');
    const lat = parseInt(crd[crd.length - 2]) / 100000;
    const lng = parseInt(crd[crd.length - 1]) / 100000;
    return {
      key,
      coords: [lng, lat]
    };
  });
  const geojsonFilter = (featureCollection, predicate) => {
    const features = featureCollection.features.filter(predicate);
    return turf.featureCollection(features);
  };
  const getInterestsRedis = async (points) => {
    const interests = [];
    const pipeline  = redis.pipeline();
    points.forEach(point => pipeline.hgetall(point.properties.key, (err, res) => {
      const interest = turf.point(
        point.geometry.coordinates,
        {
          ...res,
          key: point.properties.key
        }
      );
      interests.push(interest);
    }));
    await pipeline.exec();
    return interests;
  };

  // 1: find the shortest route
  const shortestRoute = await getShortestRoute(startEndCoords);
  // 2: find the possible points of interests
  const offsetDeg = 0.0001 * 5; // approx 10m * 5
  const bbox = computeBoundingBox(shortestRoute.polyline, offsetDeg);
  // 3: make the keys into points
  const allKeys = await redis.keys(`${global.redisPrefix}-interest-*`);
  const points = makeCoordsFromKeys(allKeys)
    .map(obj => turf.point(obj.coords, {key: obj.key}));
  // 4: filter the points so that they fall in the bounding box
  const features = turf.featureCollection(points);
  const possiblePoints = turf.pointsWithinPolygon(features, bbox);
  // 5: filter the points so that they are close to the original route
  // TODO: make this function of the distance travelled, with a max
  const offsetKm  = 0.05;
  const closePoints = possiblePoints.features.filter(point => {
    return turf.nearestPointOnLine(shortestRoute.polyline, point).properties.dist < offsetKm;
  });
  // 6: get the interests properties from the database and apply them to the points
  let interests = await getInterestsRedis(closePoints); // interests array
  // 7: get the 7 most interesting ones
  // TODO: make this function of the distance travelled, with a maximum
  interests = interests.sort((a, b) => {
    return a.properties.interest - b.properties.interest;
  }).sort((a, b) => {
    return b.properties.pics - a.properties.pics;
  }).slice(0 ,7);
  // 8: get the time matrix
  let coords = [alng, alat];
  interests.forEach(interest => {
    coords = [...coords, interest.geometry.coordinates[0], interest.geometry.coordinates[1]];
  });
  coords = [...coords, blng, blat];
  const matrix = await mapboxService('matrix', coords);
  // 8': determine max numbers of interests we want, random
  //     + limit for the reasonable amount of time

  // 9: compute new route based on travel times and interests

  // 10: get the new route

  // 11: format the new route and send it to the user


  return matrix;

  // // number function of distance travelled
  // const target = Math.ceil(distanceTravelled / 500) +
  //   Math.floor(Math.random() * Math.floor(distanceTravelled / 500));
  // const ints = interests.sort((a, b) => {
  //   return a.interest - b.interest;
  // }).slice(0, 2* target);
  // // sort by interest, pics, views
  // // eslint-disable-next-line
  // // console.log(target);
  // const random = ints.pickRandoms(target);
  // // TODO: order waypoints according to distances
  //
  // const route = [];
  // // AFTER THIS THE CODE BECOMES SHIT (before too actually)
  // // find first let
  // const firstLeg = {
  //   id: 0,
  //   distance: Infinity
  // };
  // // TODO: sometimes key is undefined
  // for (let i = 0; i < random.length; i++) {
  //   const waypointCoords = random[i].key.split('-');
  //   const lng = parseInt(waypointCoords[waypointCoords.length - 1]) / 100000;
  //   const lat = parseInt(waypointCoords[waypointCoords.length - 2]) / 100000;
  //   const res = await axios.get(`${mapboxAPI}/mapbox/walking/${alng},${alat};${lng},${lat}?geometries=geojson&access_token=${token}`);
  //   const distance = res.data.routes[0].distance;
  //   if (distance < firstLeg.distance) {
  //     firstLeg.id = i;
  //     firstLeg.distance = distance;
  //   }
  // }
  // route.push(random[firstLeg.id]);
  // random.splice(firstLeg.id, 1);
  //
  // // now order the waypoints with the first
  // while (random.length) {
  //   const mem = {
  //     id: 0,
  //     distance: Infinity
  //   };
  //   for (let i = 0; i < random.length; i++) {
  //     const waypointCoords = random[i].key.split('-');
  //     const lng = parseInt(waypointCoords[waypointCoords.length - 1]) / 100000;
  //     const lat = parseInt(waypointCoords[waypointCoords.length - 2]) / 100000;
  //     const res = await axios.get(`${mapboxAPI}/mapbox/walking/${alng},${alat};${lng},${lat}?geometries=geojson&access_token=${token}`);
  //     const distance = res.data.routes[0].distance;
  //     if (distance < firstLeg.distance) {
  //       mem.id = i;
  //       mem.distance = distance;
  //     }
  //   }
  //   route.push(random[mem.id]);
  //   random.splice(mem.id, 1);
  // }
  //
  // // route is ordered, let's get the new route
  //
  // const waypoints = [];
  // for (let r of route) {
  //   const waypointCoords = r.key.split('-');
  //   const lng = parseInt(waypointCoords[waypointCoords.length - 1]) / 100000;
  //   const lat = parseInt(waypointCoords[waypointCoords.length - 2]) / 100000;
  //   waypoints.push(`${lng},${lat}`);
  // }
  // const waypointsRoute = waypoints.join(';');
  //
  // const finalRouteReq = await axios.get(`${mapboxAPI}/mapbox/walking/${alng},${alat};${waypointsRoute};${blng},${blat}?geometries=geojson&access_token=${token}`);
  // const finalRouteData = finalRouteReq.data.routes[0];
  // // TODO: format the route again, with interests data
  // // TODO: return new route
  //
  // // now the code becomes a bit better
  // const finalLine = turf.lineString(
  //   finalRouteData.geometry.coordinates,
  //   { forLayer: 'line' }
  // );
  // const start = turf.point(
  //   finalRouteReq.data.waypoints[0].location,
  //   {
  //     forLayer: 'startend',
  //     name: finalRouteReq.data.waypoints[0].name
  //   }
  // );
  // const end = turf.point(
  //   finalRouteReq.data.waypoints[finalRouteReq.data.waypoints.length - 1].location,
  //   {
  //     forLayer: 'startend',
  //     name: finalRouteReq.data.waypoints[finalRouteReq.data.waypoints.length - 1].name
  //   }
  // );
  //
  // const interestsGeometry = [];
  // for (let i = 0; i < route.length; i++) {
  //   interestsGeometry.push(turf.point(
  //     finalRouteReq.data.waypoints[i+1].location,
  //     {
  //       forLayer: 'interests',
  //       name: finalRouteReq.data.waypoints[i+1].name,
  //       ...route[i]
  //     }
  //   ));
  // }
  //
  // const geometry = turf.featureCollection([
  //   finalLine,
  //   start,
  //   end,
  //   ...interestsGeometry
  // ]);
  //
  // const { legs, duration, distance } = finalRouteData;
  // const dataToSendBack = {
  //   legs, duration, distance
  // };
  //
  // return {
  //   geometry,
  //   data: dataToSendBack
  // };
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
