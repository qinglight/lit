var color = require('colors');
var light = {};

light.util = require('./util');
light.config = require('./config');
light.commander = require('commander');

['create', 'gen', 'release', 'server', 'plugin'].forEach(function (cmd) {
    var cmdDetail = require('../command/' + cmd);
    var command = light.commander
        .command(cmdDetail.command)
        .usage(cmdDetail.usage)
        .description(cmdDetail.description)
        .action(require("../service/"+cmd).do);//因为这里导致require还没有成功，action在执行到才会被调用，不要一开始就执行

    cmdDetail.option.forEach(function (option) {
        command.option(option.op, option.desc);
    })
});


module.exports = light;