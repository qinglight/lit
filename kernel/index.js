var color = require('colors');
var light = {};

light.util = require('./util');
light.config = require('./config');
light.commander = require('commander');

//插件初始化
//要完善整个工具的完整的生命周期
//插件分为两种，命令插件和release插件
//资源的预处理和后处理

var os = require("os");
var pluginsDir = light.util.join(os.homedir(),".lighting-plugins");

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