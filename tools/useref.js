var through = require('through2');
var gutil = require('gulp-util');
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
        if(files.length==1){
          pattern = "{"+searchPath.join(",")+"}/"+ files[0];
        }


        var src = vfs.src(pattern)
        src
          .pipe(gulpif(!options.noconcat, concat(options.dist+"/"+name)))
          .pipe(through.obj(function (newFile, encoding, callback) {

            newFile.base=(function(){
              var base;
              _.forEach(searchPath,function(path){
                if(newFile.path.indexOf(newFile.base+path)==0){
                  base = path;
                }
              });
              if(!base){
                base = options.dist;
              }
              return base;
            })();
            that.push(newFile);
            callback();

          }));
      });
    });

    setTimeout(function () {
      cb();
    },1000)
  });
}

module.exports = _useref;