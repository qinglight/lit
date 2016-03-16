var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var HtmlDom = require('htmldom');
var _ = require('../kernel').util;

const PLUGIN_NAME = 'gulp-light-resource';

function resource(options) {

  return through.obj(function(file, enc, cb) {
    var that = this;
    if (file.isNull()) {
      return cb(null, file);
    }
    if (file.isBuffer()) {
      
    }
    if (file.isStream()) {
      return cb(null, file);
    }

    cb(null, file);
  });
}

module.exports = resource;