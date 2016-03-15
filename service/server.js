var jres = require('../kernel'),
	_ = jres.util,
	gulp = require('gulp'),
	$ = require('gulp-load-plugins')();

exports.do = function(cmd,options) {
	options = _.merge({
		port:3000,
		root:'wwwroot'
	},options);

	gulp.task('server',function () {
    $.connect.server({
      root: options.root,
      livereload: false,
      port: options.port
    });
  });

  require('run-sequence')('server');
}