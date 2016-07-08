var through = require('through2');
var gutil = require('gulp-util');
var _ = require('../kernel').util;

function template(options) {

  return through.obj(function(file, enc, cb) {
    var that = this;
    if (file.isNull()) {
      return cb(null, file);
    }
    if (file.isBuffer()) {
      var name = file.path.split(require("path").sep).pop().split("\.")[0];
      file.contents = new Buffer("App."+name+"Template="+_.template(file.contents).source);
      file.path = file.path.replace(/tpl$/i,"js");
    }
    if (file.isStream()) {
      return cb(null, file);
    }

    cb(null, file);
  });
}

module.exports = template;