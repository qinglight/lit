var color = require('colors');
var light = {},
    child_process = require('child_process');

light.util = require('./util');
light.config = require('./config');
light.commander = require('commander');

//插件初始化
//要完善整个工具的完整的生命周期
//插件分为两种，命令插件和release插件
//资源的预处理和后处理

var _ =  light.util;
var os = require("os");
var pluginsDir = light.util.join(os.homedir(),".lighting-plugins");

//查询有哪些插件并将插件初始化
if(_.existsSync(pluginsDir)){
    var plugins = child_process.execSync("npm ls --parseable --depth=0", {
        cwd:pluginsDir
    }).toString().split("\n");

    plugins.shift();//去除目录
    plugins.pop();//去除最后的空格

    plugins.forEach(function (plugin) {
        plugin = require(plugin);
        plugin.install(light);
    })
}



['create', 'gen', 'release', 'server', 'plugin'].forEach(function (cmd) {
    var cmdDetail = require('../command/' + cmd);
    var command = light.commander
        .command(cmdDetail.command)
        .usage(cmdDetail.usage)
        .description(cmdDetail.description)
        .action(require("../service/"+cmd).do);

    cmdDetail.option.forEach(function (option) {
        command.option(option.op, option.desc);
    })
});


module.exports = light;