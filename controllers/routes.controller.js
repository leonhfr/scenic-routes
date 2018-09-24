'use strict';

module.exports.getRoutes = async (ctx, next) => {
  ctx.body = {
    'Lng A': ctx.params.alng,
    'Lat A': ctx.params.alat,
    'Lng B': ctx.params.blng,
    'Lat B': ctx.params.blat,
  };
  ctx.status = 200;
};
