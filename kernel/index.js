var color = require('colors');
var light = {};

light.util = require('./util');
light.config = require('./config');
light.commander = require('commander');

['create', 'gen', 'release', 'server'].forEach(function (cmd) {
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