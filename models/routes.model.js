'use strict';

const axios = require('axios');
const redis = require('./redis');

const mapboxAPI = 'https://api.mapbox.com/directions/v5';

module.exports.getRoutes = async (alng, alat, blng, blat) => {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  const res = await axios.get(`${mapboxAPI}/mapbox/walking/${alng},${alat};${blng},${blat}?geometries=geojson&access_token=${token}`);
  return res.data;
  // return {
  //   'Lng A': alng,
  //   'Lat A': alat,
  //   'Lng B': blng,
  //   'Lat B': blat
  // };
};
