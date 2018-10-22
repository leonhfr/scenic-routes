'use strict';

module.exports.getBoundaries = async () => {
  // I sleep to simulate workload and show off my cool loader
  // For future devs: the pacman loader is a sacred part of the app
  await sleep(600);
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
