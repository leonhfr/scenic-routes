'use strict';

const redis = require('../models/redis');

const processBatch = async (batch, page) => {
  // { page, pages, perpage, total, photo }
  await Promise.all(batch.photo.map(async photo => {
    const lat  = parseFloat(photo.latitude);
    const long = parseFloat(photo.longitude);
    const pixelLat  = Math.round(lat  * 100000);
    const pixelLong = Math.round(long * 100000);
    const key = `${process.env.REDIS_PREFIX}-pixel-${pixelLat}-${pixelLong}`;

    const score = await redis.hget(key, 'pics');
    if (score) {
      await redis.hincrby(key, 'pics', 1);
      await redis.hincrby(key, 'views', photo.views);
    } else {
      await redis.hmset(key, {
        pics: 1,
        interest: page,
        views: photo.views,
        id: photo.id,
        urlc: photo.url_c,
        urls: photo.url_s
      });
      // TODO: title, .. to show the user on the map
    }
  }));
};

module.exports = processBatch;
