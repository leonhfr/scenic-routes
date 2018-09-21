'use strict';

const cliProgress = require('cli-progress');

const redis = require('../models/redis');
const flickrCall = require('./flickr.service');
const lastMidnight = require('../utils/last-midnight.utils');
const processBatch = require('./process-batch.service');

const buildDatabase = async (flush) => {
  if (flush) {
    // options to flush all pixels from db
    // eslint-disable-next-line
    console.log('Flushing Redis database...');
    const keys = await redis.keys(`${global.redisPrefix}-pixel-*`);
    const pipeline = redis.pipeline();
    keys.forEach(key => pipeline.del(key));
    await pipeline.exec();
  }

  // DEFINE COMMAND LINE PROGRESS BAR
  const bar = new cliProgress.Bar({
    barsize: 80
  }, cliProgress.Presets.shades_classic);
  const start = Date.now();

  // DEFINE REQUEST PARAMETERS

  const bbox = [
    process.env.GEO_BBOX_LEFT,
    process.env.GEO_BBOX_BOTTOM,
    process.env.GEO_BBOX_RIGHT,
    process.env.GEO_BBOX_TOP
  ].join(',');

  // TODO: make options not hardcoded

  const year  = 60 * 60 * 24 * 7 * 30 * 365;
  const max_upload_date = lastMidnight();
  const min_upload_date = max_upload_date - year;

  const target = 10000;
  const sort = 'interestingness-desc';
  const per_page = 250;

  // GET FIRST BATCH TO KNOW HOW MANY CALLS WE HAVE TO MAKE
  // MAX 3600 calls / hour
  const pages = Math.ceil(target / per_page);
  bar.start(pages, 0);

  for (let i = 1; i <= pages; i++) {
    const batch = await flickrCall({
      bbox,
      sort,
      max_upload_date,
      min_upload_date,
      per_page
    }, i);
    await processBatch(batch, );
    bar.update(i);
  }
  bar.stop();

  const promises = []; // TODO implement Promise.some

  // TODO: compile JSON

  return true;

  // TODO: last update date to database
};

module.exports = buildDatabase;

// REDIS STRUCTURE
// -pixel-long-lat (bottom left)
