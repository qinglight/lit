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

//project.js中预定义的代码合并
//**************************************************************
var jobsInProject = [];
for(var key in project.release){
  var data = project.release[key];
  var data_buffer = [];
  _.forEach(data,function(d){
    data_buffer.push("dist/"+d);
  });
  gulp.task(key,function(){
    return gulp.src(data_buffer)
      .pipe($.concat(key))
      .pipe(gulp.dest(app.dist))
  });
  jobsInProject.push(key);
}
//***************************************************************

gulp.task('resources',function(){
  return gulp.src(['src/**','!src/html/**','!src/template/**'])
    .pipe(gulp.dest(app.dist))
});

gulp.task('template',function(){
  return gulp.src(['src/template/**'])
    .pipe(require("../tools/template")())
    .pipe($.uglify())
    .pipe(gulp.dest(app.dist+"/template"))
});

gulp.task('release:dev',function () {
  runSequence(['resources','template'],jobsInProject);
  return gulp.src(app.pages)
    .pipe(require("../tools/assemble")({views:"src/html/view",snippets:"src/html/snippet",beautify:true}))
    .pipe(gulp.dest(app.dist))
});


gulp.task('release:product',['resources','template'],function () {
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