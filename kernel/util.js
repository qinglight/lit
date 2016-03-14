var log4js = require('log4js'),
    lodash = require('lodash'),
    fs = require('fs-utils'),
    _ = {};

log4js.loadAppender('console');

var logger = log4js.getLogger('jres');
logger.setLevel('debug');

lodash.merge(_,lodash,fs);

lodash.merge(_,{
    log:function(msg,level){
        level=level||'info';
        logger[level](msg)
    }
})

module.exports=_;