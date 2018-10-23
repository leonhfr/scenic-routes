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
  const matrixSortByFirstRow = (matrix) => {
    matrix = matrixTranspose(matrix);
    matrix = matrix.sort((a, b) => {
      return a[0] - b[0];
    });
    return matrixTranspose(matrix);
  };
  const matrixTranspose = (matrix) => {
    const len = matrix.length;
    for (let n = 0; n < len - 1; n++) {
      for (let m = n + 1; m < len; m++) {
        [matrix[n][m], matrix[m][n]] = [matrix[m][n], matrix[n][m]];
      }
    }
    return matrix;
  };
  const getNaturalOrder = (matrixRow) => {
    return matrixRow
      .map((el, index) => ({ el, index }))
      .sort((a, b) => (a.el - b.el))
      .map(el => el.index);
  };
  const pickSomeInterests = (interests, n) => {
    const picks = [];
    // TODO: randomize the list
    for (let i = 0; i < interests.length; i++) {
      const index = pickOne(interests);
      picks.push(interests[index]);
      interests = interests.slice(0, index).concat(interests.slice(index + 1));
    }
    let others = [...interests];
    return { picks, others };
  };
  const pickOne = (interests) => {
    const total = interests.reduce((acc, val) => {
      return acc + 1 + Math.log(parseInt(val.properties.pics));
    }, 0);
    let random = 1 + Math.floor(Math.random() * Math.floor(total));
    for (let i = 0; i < interests.length; i++) {
      random -= (1 + Math.log(parseInt(interests[i].properties.pics)));
      if (random <= 0) return i;
    }
    return 0;
  };


  // 1: find the shortest route
  const shortestRoute = await getShortestRoute(startEndCoords);
  // 2: find the possible points of interests
  const offsetDeg = 0.0001 * 5; // approx 10m * 5
  const bbox = computeBoundingBox(shortestRoute.polyline, offsetDeg);
  // eslint-disable-next-line
  // console.log('Distance: ', shortestRoute.distance);
  // 3: make the keys into points
  const allKeys = await redis.keys(`${process.env.REDIS_PREFIX}-interest-*`);
  const points = makeCoordsFromKeys(allKeys)
    .map(obj => turf.point(obj.coords, {key: obj.key}));
  // 4: filter the points so that they fall in the bounding box
  const features = turf.featureCollection(points);
  const possiblePoints = turf.pointsWithinPolygon(features, bbox);
  // 5: filter the points so that they are close to the original route
  const offsetKm  = 0.05 + 0.05 * ((shortestRoute.distance < 1000) ? shortestRoute.distance / 1000 : 1);
  const closePoints = possiblePoints.features.filter(point => {
    return turf.nearestPointOnLine(shortestRoute.polyline, point).properties.dist < offsetKm;
  });

  if (!closePoints.length) return await newRoute(startEndCoords, [], []);

  // 6: get the interests properties from the database and apply them to the points
  let interests = await getInterestsRedis(closePoints); // interests array
  // 7: get the 7 most interesting ones
  const target = Math.min(2 + Math.round(shortestRoute.distance / 150), 12);
  // eslint-disable-next-line
  // console.log('Target: ', target);
  interests = interests.sort((a, b) => {
    return a.properties.interest - b.properties.interest;
  }).sort((a, b) => {
    return b.properties.pics - a.properties.pics;
  }).slice(0, target);
  const n = 1 + Math.ceil(interests.length * 0.3);
  // eslint-disable-next-line
  // console.log('n: ', n);
  const interestSelection = pickSomeInterests(interests, n);
  // 8: get the time matrix
  let coords = [alng, alat];
  interestSelection.picks.forEach(interest => {
    coords = [...coords, ...interest.geometry.coordinates];
  });
  coords = [...coords, blng, blat];
  // console.log(coords);
  const matrix = await mapboxService('matrix', coords);

  let order = getNaturalOrder(matrix.durations[0]);
  order.pop();
  order.shift();

  const orderedPicks = [];
  for (let i = 0; i < order.length; i++) {
    orderedPicks.push(interestSelection.picks[order[i]-1]);
  }

  async function newRoute (startEndCoords, picks, others) {
    let coords = [...startEndCoords.slice(0, 2)];

    // TODO: looks like sometimes picks and/or others have invalid values
    // sanitizing the data as a quick fix
    let len = picks.length;
    picks = picks.filter(el => (typeof el !== 'undefined'));
    others = others.filter(el => (typeof el !== 'undefined'));

    // console.log(picks);
    // if (picks.length !== len) console.log('filtered');
    picks.forEach(waypoint => {
      coords = coords.concat(waypoint.geometry.coordinates);
    });
    coords = coords.concat(startEndCoords.slice(2));
    const route = await mapboxService('directions', coords);

    const polyline = turf.lineString(
      route.routes[0].geometry.coordinates,
      { forLayer: 'line' }
    );

    const start = turf.point(
      route.waypoints[0].location,
      {
        forLayer: 'startend',
        name: route.waypoints[0].name
      }
    );

    const end = turf.point(
      route.waypoints[route.waypoints.length - 1].location,
      {
        forLayer: 'startend',
        name: route.waypoints[route.waypoints.length - 1].name
      }
    );

    const interestsPicks = [];
    for (let i = 0; i < picks.length; i++) {
      interestsPicks.push(turf.point(
        route.waypoints[i+1].location,
        {
          forLayer: 'interests',
          name: route.waypoints[i+1].name,
          ...picks[i].properties
        }
      ));
    }

    for (let i = 0; i < others.length; i++) {
      others[i].properties.forLayer = 'others';
    }

    const geometry = turf.featureCollection([
      polyline,
      start,
      end,
      ...interestsPicks,
      ...others
    ]);

    const { legs, duration, distance } = route.routes[0];
    const data = { legs, duration, distance };

    return { geometry, data };
  }

  return await newRoute(startEndCoords, orderedPicks, interestSelection.others);
};

// TODO: select interests based on quality
// TODO: select interests based on added time travel
