var through = require('through2');
var _ = require('../kernel').util;
var config = require('../kernel').config;
var useref = require('useref');
var cheerio = require('cheerio');
var concat = require('gulp-concat');
var gulpif = require('gulp-if');
var vfs = require('vinyl-fs');

function _useref(options) {
  return through.obj(function(file, enc, cb) {
    var that = this;

    var output = useref(file.contents.toString(),options);
    var $ = cheerio.load(output[0],{
      recognizeSelfClosing:true
    });

    var _js = $("script[src]").not("[src^=http]").not("[src^=\\/\\/]");
    var _css = $("link[rel=stylesheet][href]");

    var js = [];
    _.forEach(_js, function (file) {
      js.push(file.attribs.src);
    });

    var css = [];
    _.forEach(_css, function (file) {
      css.push(file.attribs.href);
    });

    var unprecessStream = js.length+css.length+1;

    function processStream(files,name){
      if(typeof files=="string"){
        files = [files];
      }
      var pattern = "{"+config.tmp+","+config.src+"}/{"+files.join(",")+"}";
      if(files.length==1){
        pattern = "{"+config.tmp+","+config.src+"}/"+files[0];
      }
      vfs.src(pattern)
          .pipe(gulpif(name!=null&&!options.noconcat,concat(config.dist+"/"+name)))
          .pipe(through.obj(function (newFile, encoding, callback) {
            _.forEach([config.tmp,config.src,config.dist], function (path) {
              if(newFile.path.indexOf(process.cwd()+"/"+path+"/")==0||newFile.path.indexOf(process.cwd()+"\\"+path+"\\")==0){
                newFile.base=process.cwd()+"/"+path+"/";
              }
            });

            that.push(newFile);
            if(--unprecessStream==0){
              cb();
            }
            callback();
          }));
    }

    //先处理合并
    if(!options.noconcat){
      _.forEach(output[1].css, function (file,key) {
        css.splice(css.indexOf(key),1);
        processStream(file.assets,key);
      });

      _.forEach(output[1].js, function (file,key) {
        js.splice(js.indexOf(key),1);
        processStream(file.assets,key);
      });
    }


    _.forEach(js, function (file) {
      processStream(file);
    });


    _.forEach(css, function (file) {
      processStream(file);
    });

    file.contents = new Buffer($.html());
    that.push(file);
    if(--unprecessStream==0){
      cb();
    }
  });
}

module.exports = _useref;