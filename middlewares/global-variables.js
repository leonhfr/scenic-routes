'use strict';

const globalVariables = async (ctx, next) => {
  if (process.env.NODE_ENV === 'production') {
    global.redisPrefix = process.env.REDIS_PREFIX_PROD || 'prod';
  } else {
    global.redisPrefix = process.env.REDIS_PREFIX_DEV || 'dev';
  }
  await next();
};

module.exports = globalVariables;
