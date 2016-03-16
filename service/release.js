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
  dist:"dist",
  template:"src/template"
} 

gulp.task('clean:template', function (cb) {
  rimraf(app.template+"/*.js", cb);
});

gulp.task('clean:dist', function (cb) {
  rimraf(app.dist, cb);
});

gulp.task('resources',function(){
  var resources = ['src/**','!src/html/**','!src/js/**','!src/css/*.css','!src/template/**'];
  if(project.ignore){
    _.forEach(project.ignore,function(ignore){
      resources.push("!src/"+ignore);
      if(ignore.endsWith("/")){
        resources.push("!src/"+ignore+"/**");
      }
    })
  }
  return gulp.src(resources)
    .pipe(gulp.dest(app.dist))
});

gulp.task('template',function(){
  return gulp.src([app.template+'/*.tpl'])
    .pipe(require("../tools/template")())
    .pipe(gulp.dest(app.template))
});

gulp.task('release:dev',['resources','template'],function () {
  return gulp.src(app.pages)
    .pipe(require("../tools/assemble")({views:"src/html/view",snippets:"src/html/snippet",beautify:true}))
    .pipe($.useref({searchPath: ['src',app.template],noconcat:true,root:process.cwd()+"/src"}))
    .pipe(gulp.dest(app.dist))
});

gulp.task('release:product',['resources','template'],function () {
  var jsFilter = $.filter('**/*.js');
  var cssFilter = $.filter('**/*.css');

  return gulp.src(app.pages)
    .pipe(require("../tools/assemble")({views:"src/html/view",snippets:"src/html/snippet",beautify:true}))
    .pipe($.useref({searchPath: ['src',app.template]}))
    .pipe(jsFilter)
    .pipe($.uglify())
    .pipe($.rev())
    .pipe(jsFilter.restore())
    .pipe(cssFilter)
    .pipe($.minifyCss({cache: true}))
    .pipe($.rev())
    .pipe(cssFilter.restore())
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

  tasks.push('clean:template');

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