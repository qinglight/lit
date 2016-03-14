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
      var html = new HtmlDom(file.contents);
      var scripts = html.$("script");
      var styles = html.$("link[rel=stylesheet]");

      _.forEach(scripts,function(script){
        that.push(new gutil.File({
          base: '/mnt/d/LIGHT/Sources/h5_apps/light_quote_sh/src/css/',
          cwd: '/mnt/d/LIGHT/Sources/h5_apps/light_quote_sh/',
          path: 'css/style.css',
          contents:new Buffer("123123")
        }));
      })
    }
    if (file.isStream()) {
      return cb(null, file);
    }

    cb(null, file);
  });
}

module.exports = resource;