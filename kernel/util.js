var log4js = require('log4js'),
    lodash = require('lodash'),
    fs = require('fs-utils'),
    _ = {};

log4js.loadAppender('console');

var logger = log4js.getLogger('light');
logger.setLevel('debug');

lodash.merge(_,require("fs"));

lodash.merge(_,lodash,fs);

lodash.merge(_,{
    log:function(msg,level){
        level=level||'info';
        logger[level](msg)
    }
});

_.camel = function(str,split) {
    split = split||"/";
    var d = str.split(split);
    str = d[0];
    for(i=1;i<d.length;i++){
        str+=d[i][0].toUpperCase()+d[i].substring(1)
    }
    return str;
}

module.exports=_;
