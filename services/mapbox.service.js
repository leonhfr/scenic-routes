'use strict';

const axios = require('axios');

const mapboxService = async (service, coords) => {
  const mapboxAPI = 'https://api.mapbox.com';
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  const request = [mapboxAPI];
  if (service === 'directions') {
    request.push('/directions/v5/mapbox/walking/');
    const waypoints = [];
    for (let i = 0; i < coords.length; i += 2) {
      waypoints.push(`${coords[i]},${coords[i+1]}`);
    }
    request.push(waypoints.join(';'));
    request.push(`?geometries=geojson&access_token=${token}`);
  } else if (service === 'matrix') {
    request.push('/directions-matrix/v1/mapbox/walking/');
    const waypoints = [];
    for (let i = 0; i < coords.length; i += 2) {
      waypoints.push(`${coords[i]},${coords[i+1]}`);
    }
    request.push(waypoints.join(';'));
    request.push(`?access_token=${token}`);
  }
  const result = await axios.get(request.join(''));
  return result.data;
};

module.exports = mapboxService;
