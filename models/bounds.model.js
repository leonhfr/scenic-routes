'use strict';

module.exports.getBoundaries = async () => {
  // TODO: remove sleep, only used to simulate workload and show off my cool loader
  await sleep(1000);
  return [
    process.env.GEO_BBOX_LEFT, process.env.GEO_BBOX_BOTTOM,
    process.env.GEO_BBOX_RIGHT, process.env.GEO_BBOX_TOP
  ];
};

async function sleep (ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
