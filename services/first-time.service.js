'use strict';

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
}

const redis = require('../models/redis');
const buildDatabase = require('./build-database.service');
const buildInterests = require('./build-interests.service');
const compileHeatmap = require('./compile-heatmap.service');

(async function () {
  //eslint-disable-next-line
  console.log('*** Starting first-time script ***');
  // build database
  //eslint-disable-next-line
  console.log('* Fetching pictures 0 - 2500');
  await buildDatabase(true, 0, 10);
  //eslint-disable-next-line
  console.log('* Fetching pictures 2501 - 5000');
  await buildDatabase(false, 10, 20);
  //eslint-disable-next-line
  console.log('* Fetching pictures 5001 - 7500');
  await buildDatabase(false, 20, 30);
  //eslint-disable-next-line
  console.log('* Fetching pictures 7501 - 10000');
  await buildDatabase(false, 30, 40);
  // compile heatmap
  await compileHeatmap();
  // build interests
  await buildInterests(16, 2);
  // exit
  //eslint-disable-next-line
  console.log('*** Successfully completed first time setup! ***');
  process.exit(0);
})();
