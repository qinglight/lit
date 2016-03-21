var jres = require('../kernel'),
  _ = jres.util,
  project = require(process.cwd()+'/project.json');

//gulp
var gulp = require('gulp');
var runSequence = require('run-sequence').use(gulp);
var $ = require('gulp-load-plugins')();

app = {
  dist:"dist",
  src:"src",
  tmp:".tmp"
}

//--------------清除------------------------
gulp.task('clean:tmp', function (cb) {
  _.log("清除模板编译输出");
  _.del(app.tmp,cb);
});

gulp.task('clean:dist', function (cb) {
  _.log("清除目标(dist)目录");
  _.del(app.dist,cb);
});
//-----------------------------------------


//-------------资源准备---------------------
gulp.task('resources',function(){
  _.log("资源输出dist目录");

  project.ignore = project.ignore || [];
  var ignore  = _.union(project.ignore,['html','js','css','template']);
  return gulp.src("**/*",{cwd:app.src,ignore:ignore,nodir:true})
    .pipe(gulp.dest(app.dist))
});

gulp.task('template',function(){
  _.log("编译模板文件")
  return gulp.src([app.template+'/*.tpl'])
    .pipe(require("../tools/template")())
    .pipe(gulp.dest(app.template))
});
//-----------------------------------------

gulp.task('release:dev',['resources','template'],function () {
  _.log("准备资源处理...");
  var jsFilter = $.filter('/***.js');
  var cssFilter = $.filter('**/*.css');
  return gulp.src(app.pages)
    .pipe(require("../tools/assemble")({views:"src/html/view",snippets:"src/html/snippet",beautify:true}))
    .pipe($.useref({searchPath: ['src',app.template],noconcat:true,root:process.cwd()+"/src"}))
    .pipe(cssFilter)
    .pipe($.less())
    .pipe(cssFilter.restore())
    .pipe(gulp.dest(app.dist))
});

gulp.task('release:product',['resources','template'],function () {
  _.log("准备资源处理...");
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
    .pipe($.less())
    .pipe($.minifyCss({cache: true}))
    .pipe($.rev())
    .pipe(cssFilter.restore())
    .pipe($.revReplace())
    .pipe(gulp.dest(app.dist))
});

exports.do = function(cmd,options) {
  runSequence("resources");

  return;


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
      _.log("打包资源为发布包...");
      return gulp.src("dist/**")
        .pipe($.zip(project.project+'-'+project.version+'.zip'))
        .pipe(gulp.dest('.'));
    });

    tasks.push('pack');
  }

  if(options.brower){
    _.log("打开浏览器,开启服务监听");
    gulp.task('brower',function () {
      $.connect.server({
        root: ['dist'],
        livereload: true,
        port: 3000
      });

      require('open')("http://localhost:3000");
    });

    runSequence('brower');
  }

  tasks.push('clean:template');

  if(options.watch){
    _.log("正在监听文件变化...");
    var  watchFunc = setTimeout(function(){},200);
    var watcher = gulp.watch(['src/**/*','!src/template/*.js'], function(event){
      _.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
      clearTimeout(watchFunc);
      watchFunc = setTimeout(function(){
        runSequence.apply(null,tasks);
      },300)
    });
  }
  runSequence.apply(null,tasks);
}