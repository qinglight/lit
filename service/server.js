var light = require('../kernel'),
	_ = light.util,
	express = require("express");

exports.do = function(cmd,options) {
	options = _.merge({
		port:3000,
		root:'wwwroot'
	},options);

	var app = express();
	app.use(express.static(options.root));
	app.listen(options.port,function () {
		_.log("info","HTTP服务器正常启动")
	});
};