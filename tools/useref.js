var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var _ = require('../kernel').util;
var useref = require('useref');
var vfs = require('vinyl-fs');
var concat = require('gulp-concat');
var gulpif = require('gulp-if');

const PLUGIN_NAME = 'gulp-light-useref';

function _useref(options) {
  var searchPath = options.searchPath;

  return through.obj(function(file, enc, cb) {
    var output = useref(file.contents.toString(), options);

    file.contents = new Buffer(output[0]);
    this.push(file);

    var that = this;
    _.map(output[1],function(type){
      _.map(type,function(files,name){
        files = files.assets;
        var pattern = "{"+searchPath.join(",")+"}/"+"{"+files.join(",")+"}";
        var src = vfs.src(pattern)
        src
          .pipe(gulpif(!options.noconcat, concat(name)))
          .pipe(through.obj(function (newFile, encoding, callback) {
              newFile.base="/tmp/aaa/src"
              console.log(newFile)
              that.push(newFile);
              callback();
          }));
      })
    })
  });
}

module.exports = _useref;