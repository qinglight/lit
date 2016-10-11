var express = require("express");

exports.do = function(cmd,options,cb) {
	var light = require('../kernel'),
		_ = light.util;

	options = _.merge({
		port:3000,
		root:'wwwroot'
	},options);

	var app = express();
	app.use(express.static(options.root));
	var http = require('http').Server(app);
	http.listen(options.port,function () {
		_.log("info","HTTP服务器正常启动");

		if(cb) cb.call(null,http);
	});
};