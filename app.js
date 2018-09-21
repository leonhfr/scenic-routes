'use strict';

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
}

const Koa        = require('koa');
const bodyParser = require('koa-bodyparser');
const compress   = require('koa-compress');
const cors       = require('kcors');
const logger     = require('koa-logger');
const mount      = require('koa-mount');
const path       = require('path');
const serve      = require('koa-static');

const app = module.exports = new Koa();

const router          = require('./router.js');
const errorHandler    = require('./middlewares/error-handler');
const globalVariables = require('./middlewares/global-variables');
const data            = path.resolve(__dirname, './data');

app
  .use(logger())
  .use(cors())
  .use(mount('/data', serve(data)))
  .use(bodyParser())
  .use(errorHandler)
  .use(globalVariables)
  .use(router.allowedMethods())
  .use(router.routes())
  .use(compress());

if (!module.parent) {
  const port = process.env.PORT || 3000;
  app.listen(port);
  // eslint-disable-next-line
  console.log('Listening to %s', port);
}
