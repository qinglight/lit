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
  return rimraf(app.dist, cb);
});

//预处理
//
function processRelaseInProject(){
  var release_in_json = project.release;
  var streams = [];
  for(var key in release_in_json){
    var stream = gulp.src(release_in_json[key])
      .pipe($.concat(key));
    streams.push(stream)
  }
  return streams;
}

gulp.task('resources:css',function(){
  return gulp.src(['src/css/**'])
    .pipe(gulp.dest(app.dist+"/css"))
})

gulp.task('resources:js',function(){
  return gulp.src(['src/js/**'])
    .pipe(gulp.dest(app.dist+"/js"))
})

gulp.task('resources:extra',function(){
  return gulp.src(['src/**','!src/html/**'])
    .pipe(gulp.dest(app.dist))
})

gulp.task('release:dev',['resources:css'],function () {
  return gulp.src(app.pages)
    .pipe(require("../tools/assemble")({views:"src/html/view",snippets:"src/html/snippet",beautify:true}))
    .pipe(gulp.dest(app.dist))
});

gulp.task('release:product',['resources:css'],function () {
  var jsFilter = $.filter('**/*.js');
  var cssFilter = $.filter('**/*.css');

  return gulp.src(app.pages)
    .pipe(require("../tools/assemble")({views:"src/html/view",snippets:"src/html/snippet",beautify:true}))
    .pipe($.useref({searchPath: [app.dist,'src']}))
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

    tasks.push('brower');
  }

  runSequence.apply(null,tasks);
}