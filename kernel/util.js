var lodash = require('lodash'),
    _ = {},
    fs = require('fs-extra'),
    path = require("path"),
    glob = require("glob"),
    exec = require('child_process').exec;

_.camel = function (str, split) {
    split = split || "/";
    var d = str.split(split);
    str = d[0];
    for (i = 1; i < d.length; i++) {
        str += d[i][0].toUpperCase() + d[i].substring(1)
    }
    return str;
};

lodash.extend(_,lodash);

Date.prototype.Format = function (fmt) { //author: meizz
    var o = {
        "M+": this.getMonth() + 1,                 //月份
        "d+": this.getDate(),                    //日
        "h+": this.getHours(),                   //小时
        "m+": this.getMinutes(),                 //分
        "s+": this.getSeconds(),                 //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds()             //毫秒
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};

_.log = function (level,info) {
    info = (new Date().Format("[yyyy-MM-dd hh:mm:ss] ")+info).blue;
    console[level].apply(this,[info]);
};

lodash.extend(_,fs);

_.join = path.join;
_.parse = path.parse;
_.glob = glob;
_.open = open;

function open(target, appName, callback) {
    var opener;

    if (typeof(appName) === 'function') {
        callback = appName;
        appName = null;
    }

    switch (process.platform) {
        case 'darwin':
            if (appName) {
                opener = 'open -a "' + escape(appName) + '"';
            } else {
                opener = 'open';
            }
            break;
        case 'win32':
            // if the first parameter to start is quoted, it uses that as the title
            // so we pass a blank title so we can quote the file we are opening
            if (appName) {
                opener = 'start "" "' + escape(appName) + '"';
            } else {
                opener = 'start ""';
            }
            break;
        default:
            if (appName) {
                opener = escape(appName);
            } else {
                // use Portlands xdg-open everywhere else
                opener = path.join(__dirname, '../vendor/xdg-open');
            }
            break;
    }

    if (process.env.SUDO_USER) {
        opener = 'sudo -u ' + process.env.SUDO_USER + ' ' + opener;
    }
    return exec(opener + ' "' + escape(target) + '"', callback);
}

function escape(s) {
    return s.replace(/"/g, '\\\"');
}

module.exports = _;

