var jres = require('../kernel'),
  _ = jres.util;

var project = require(process.cwd()+'/project.json');

//gulp
var gulp = require('gulp');
var rimraf = require('rimraf');
var runSequence = require('run-sequence').use(gulp);
var $ = require('gulp-load-plugins')();

app = {
  pages:"src/html/page/*.html",
  dist:"dist"
} 

gulp.task('clean:dist', function (cb) {
  rimraf(app.dist, cb);
});

gulp.task('resources',function(){
  return gulp.src(['src/**','!src/html/**','!src/js/**','!src/css/**'])
    .pipe(gulp.dest(app.dist))
});


gulp.task('release:dev',['resources'],function () {
  return gulp.src(app.pages)
    .pipe(require("../tools/assemble")({views:"src/html/view",snippets:"src/html/snippet",beautify:true}))
    .pipe($.useref({searchPath: ['src']}))
    .pipe(gulp.dest(app.dist))
});


gulp.task('release:product',['resources'],function () {
  var jsFilter = $.filter('**/*.js');
  var cssFilter = $.filter('**/*.css');

  return gulp.src(app.pages)
    .pipe(require("../tools/assemble")({views:"src/html/view",snippets:"src/html/snippet",beautify:true}))
    .pipe($.useref({searchPath: ['src']}))
    .pipe(jsFilter)
    .pipe($.uglify())
    .pipe(jsFilter.restore())
    .pipe(cssFilter)
    .pipe($.minifyCss({cache: true}))
    .pipe(cssFilter.restore())
    .pipe($.rev())
    .pipe($.revReplace())

    .pipe(gulp.dest(app.dist))
});

exports.do = function(cmd,options) {
  var tasks = ['clean:dist'];

  //优化
  if(options.uglify){
    tasks.push('release:product');
  }else{
    tasks.push('release:dev');
  }

  //部署
  if(options.deploy){
    gulp.task('deploy',function () {
      return gulp.src("dist/**")
          .pipe(gulp.dest(options.deploy||"wwwroot"))
    });

    tasks.push('deploy');
  }

  //打包
  if(options.pack){
    gulp.task('pack',function () {
      
      return gulp.src("dist/**")
        .pipe($.zip(project.project+'-'+project.version+'.zip'))
        .pipe(gulp.dest('.'));
    });

    tasks.push('pack');
  }

  if(options.brower){
    gulp.task('brower',function () {
      $.connect.server({
        root: ['dist'],
        livereload: true,
        port: 3000
      });

      require('open')("http://localhost:3000");
    });

    runSequence(brower);
  }

  if(options.watch){
    var watcher = gulp.watch(['src/**/*'], function(){
      runSequence.apply(null,tasks);
    });
    watcher.on('change', function(event) {
      console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
    });
  }
  
  runSequence.apply(null,tasks);
}