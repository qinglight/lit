var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var HtmlDom = require('htmldom');
var _ = require('../kernel').util;

const PLUGIN_NAME = 'gulp-light-template';

function template(options) {

  return through.obj(function(file, enc, cb) {
    var that = this;
    if (file.isNull()) {
      return cb(null, file);
    }
    if (file.isBuffer()) {
      var name = file.path.split("/").pop().split("\.")[0];
      file.contents = new Buffer("App."+name+"Template="+_.template(file.contents).source);
    }
    if (file.isStream()) {
      return cb(null, file);
    }

    cb(null, file);
  });
}

module.exports = template;