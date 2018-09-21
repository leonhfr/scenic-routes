'use strict';

module.exports = () => {
  // returns timestamp at last midnight
  const msDay  = 86400000;
  const now    = new Date();
  let midnight = Date.now();
  midnight  = ~~(midnight / 1000);
  midnight -= 60 * 60 * now.getHours();
  midnight -= 60 * now.getMinutes();
  midnight -= now.getSeconds();
  return midnight;
};
