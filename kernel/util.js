var lodash = require('lodash'),
    _ = {},
    fs = require('fs-extra'),
    path = require("path"),
    glob = require("glob");

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
    info = (new Date().Format("[yyyy-MM-dd hh:mm:ss]")+" ["+level+"] "+info).green;
    console.log.apply(this,[info]);
};

lodash.extend(_,fs);

_.join = path.join;
_.parse = path.parse;
_.glob = glob;

module.exports = _;

