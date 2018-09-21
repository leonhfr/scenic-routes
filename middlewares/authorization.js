'use strict';

const bcrypt = require('bcrypt');
const btoa = require('atob');

const redis  = require('../models/redis');

const authorize = async (ctx, next) => {
  const basic = ctx.headers.authorization.split(' ');
  if (basic.length < 2 || basic[0] !== 'Basic') {
    ctx.status = 400;
    return;
  }
  const [username, password] = btoa(basic[1]).split(':');
  const userPassword = await redis.get(`${global.redisPrefix}-user-${username}`);
  const match = await bcrypt.compare(password, userPassword);
  if (!match) {
    ctx.status = 401;
    return;
  }
  await next();
};

module.exports = authorize;
