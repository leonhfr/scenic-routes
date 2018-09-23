'use strict';

const lastMidnight = require('../utils/last-midnight.utils');

const Flickr = require('flickr-sdk');
const flickr = new Flickr(process.env.FLICKR_API_KEY);

const flickrService = async (options, page) => {
  // options = { bbox, max_upload_date, min_upload_date, sort, per_page, page }
  page = page || 1;

  if (!options || !options.bbox) {
    throw new Error('Calls to the Flickr API must have a Bounding Box');
  }

  if (typeof options.bbox !== 'string') options.bbox = options.bbox.join(',');
  options.max_upload_date = options.max_upload_date || lastMidnight();
  options.sort            = options.sort            || 'date-posted-desc';
  options.per_page        = options.per_page        || 250;

  const constants = {
    page,
    accuracy: 16,
    content_type: 1,
    media: 'photos',
    extras: 'geo,views,url_c,url_s'
  };

  const flickrOptions = Object.assign(constants, options);

  const photos = await flickr.photos.search(flickrOptions);
  const data   = JSON.parse(photos.res.text).photos;

  return data;
};

module.exports = flickrService;

// url_c, URL of medium 800, 800 on longest size image
// url_m, URL of small, medium size image
// url_n, URL of small, 320 on longest side size image
// url_o, URL of original size image
// url_q, URL of large square 150x150 size image
// url_s, URL of small suqare 75x75 size image
// url_sq, URL of square size image
// url_t, URL of thumbnail, 100 on longest side size image
