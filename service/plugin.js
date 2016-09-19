var child_process = require('child_process'),
	_ = require("../kernel/util");

exports.do = function(cmd,options) {
	var os = require("os");
	var pluginsDir = _.join(os.homedir(),".lighting-plugins");

	if(!_.existsSync(pluginsDir)){
		_.mkdirsSync(pluginsDir);
	}

	if(options.add){
		// 添加插件
		child_process.exec("npm --registry=https://registry.npm.taobao.org install -d lighting-plugin-" + options.add, {
			cwd:pluginsDir
		}, function (err, stdout) {
			_.log("info",stdout)
		})
	}
};