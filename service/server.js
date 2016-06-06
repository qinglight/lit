var jres = require('../kernel'),
	_ = jres.util,
	gulp = require('gulp'),
	$ = require('gulp-load-plugins')();

exports.do = function(cmd,options) {
	options = _.merge({
		port:3000,
		root:'wwwroot'
	},options);

	$.connect.server({
		root: options.root,
		livereload: true,
		port: options.port
	});
	return $.connect;
};