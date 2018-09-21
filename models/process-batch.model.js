'use strict';

const redis = require('./redis');

const processBatch = async (batch) => {
  // { page, pages, perpage, total, photo }
  await Promise.all(batch.photo.map(async photo => {
    const lat  = parseFloat(photo.latitude);
    const long = parseFloat(photo.longitude);
    const pixelLat  = Math.round(lat  * 10000);
    const pixelLong = Math.round(long * 10000);
    const key = `${global.redisPrefix}-pixel-${pixelLat}-${pixelLong}`;

    const score = await redis.hget(key, 'score');
    if (score) {
      await redis.hincrby(key, 'score', 1);
    } else {
      await redis.hmset(key, {
        score: 1,
        id: photo.id,
        url: photo.url_m,
        size: `${photo.height_m}x${photo.width_m}`
      });
    }
  }));
};

module.exports = processBatch;
