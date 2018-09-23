'use strict';

module.exports.getBoundaries = async () => {
  return [
    process.env.GEO_BBOX_LEFT, process.env.GEO_BBOX_BOTTOM,
    process.env.GEO_BBOX_RIGHT, process.env.GEO_BBOX_TOP
  ];
};
