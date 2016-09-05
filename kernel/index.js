var jres={},
    path = require('path');

jres.util=require('./util');
jres.config=require('./config');

jres.commander = require('commander');

jres.require=function(){
  var argv = Array.prototype.slice.call(arguments, 0),
    name = argv.join('-');

  if(argv[0] === 'command'){
      var com = registeCmd(argv[1]);
      return com;
      jres.log("can't find command "+argv[1],"error");
      process.exit(1);
  }
};

function registeCmd(cmd){
  var commander = jres.commander,
    options = require('../command/'+cmd),
    command = commander.command(options.command)
               .usage(options.usage)
               .description(options.description),
    option = options.option,
    action = require('../service/'+cmd).do,
    keys = [];

    for (var i = 0; i < option.length; i++) {
      command.option(option[i].op,option[i].desc,option.type);
      keys.push(option[i].key);
    }

    command.action(function(argv){
      var _config = Array.prototype.slice.call(arguments).pop();
      _config = jres.util.pick(_config,keys);
      for(var key in _config){
        if(typeof _config[key] == "function"){
          _config[key] = null;
        }
      }
      action.call(this,argv,_config);
    });
};

module.exports=jres;