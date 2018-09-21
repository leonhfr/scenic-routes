'use strict';

const REDIS_URL  = process.env.REDIS_URL  || '127.0.0.1';
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const Redis = require('ioredis');

module.exports = new Redis(REDIS_PORT, REDIS_URL);
