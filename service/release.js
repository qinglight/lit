var jres = require('../kernel'),
  _ = jres.util,
  project = _.exists(process.cwd()+'/project.json')?require(process.cwd()+'/project.json'):{},
  lazypipe = require('lazypipe');

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
  var _ignore  = _.union(project.ignore,['html/**','js/**','css/**','template/**']);
  var ignore = [];

  _.forEach(_ignore,function(value){
    ignore.push(process.cwd()+"/"+app.src+"/"+value);
  });

  return gulp.src("**/*",{cwd:app.src,ignore:ignore,nodir:true})
    .pipe(gulp.dest(app.dist))
});
//-----------------------------------------

//-------------模板编译---------------------
gulp.task('template',function(){
  _.log("编译js模板文件")
  return gulp.src([app.src+'/template/*.tpl'])
    .pipe(require("../tools/template")())
    .pipe(gulp.dest(app.tmp+"/template"))
});

gulp.task('jade',function(){
  _.log("编译视图模板文件")
  return gulp.src([app.src+'/html/**/*.jade'])
    .pipe($.jade())
    .pipe(gulp.dest(app.tmp+"/html"))
});

gulp.task('less',function(){
  _.log("编译less样式文件")
  return gulp.src([app.src+'/css/**/*.less'])
    .pipe($.less())
    .pipe(gulp.dest(app.tmp+"/css"))
});

gulp.task('coffee',function(){
  _.log("编译coffeeScript文件")
  return gulp.src([app.src+'/js/**/*.coffee'])
      .pipe($.coffee())
      .pipe(gulp.dest(app.tmp+"/js"))
});

gulp.task('html',['jade'],function(){
  return gulp.src([app.src+'/html/page/*.html',app.tmp+'/html/page/*.html'])
    .pipe(gulp.dest(app.tmp))
});
//-----------------------------------------

//-------------extra-----------------------
gulp.task('pack',function () {
  _.log("打包资源为发布包");
  return gulp.src("dist/**")
    .pipe($.zip(project.project+'-'+project.version+'.zip'))
    .pipe(gulp.dest('.'));
});

gulp.task('brower',function () {
  _.log("打开浏览器,开启服务监听");
  $.connect.server({
    root: ['dist'],
    livereload: true,
    port: 3000
  });
  require('open')("http://localhost:3000");
});
//-----------------------------------------

exports.do = function(cmd,options) {
  if(options.product){
    options.suffix=true;
    options.uglify=true;
    options.concat=true;
  }

  //-------------资源集成---------------------
  gulp.task('release',['resources','template','html','less','coffee'],function () {
    _.log("准备资源处理...");

    return gulp.src([app.tmp+"/*.html"])
      .pipe(require("../tools/assemble")({type:project.type||"light"}))
      .pipe(require("../tools/useref")({searchPath: [app.src,app.tmp],dist:app.dist,noconcat:!options.concat}))
      .pipe($.if(function(file){
        return options.uglify&&file.extname&&file.extname==".js";
      },$.uglify()))
      .pipe($.if(function(file){
        return options.uglify&&file.extname&&file.extname==".css";
      },$.minifyCss({cache: true})))
      .pipe($.if(function(file){
        return options.suffix&&file.extname&&file.extname!=".html";
      },$.rev()))
      .pipe($.revReplace())
      .pipe(gulp.dest(app.dist))
      .pipe($.if(options.watch,$.connect.reload()))
  });
  //-----------------------------------------
  
  var tasks = ['clean:dist','release'];

  if(options.pack){
    tasks.push('pack');
  }

  if(options.brower){
    runSequence('brower');
  }

  tasks.push('clean:tmp');

  if(options.watch){
    _.log("正在监听文件变化...");
    var  watchFunc = setTimeout(function(){},200);
    var watcher = gulp.watch(process.cwd()+"/"+app.src+"/**/*", function(event){
      _.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
      clearTimeout(watchFunc);
      watchFunc = setTimeout(function(){
        runSequence.apply(null,tasks);
      },300)
    });
  }
  runSequence.apply(null,tasks);
}