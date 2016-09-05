var light = require('./kernel');
var art = require('ascii-art');
var lighting_str = `
 _  _         _      _    _               
| |(_)       | |    | |  (_)              
| | _   __ _ | |__  | |_  _  _ __    __ _ 
| || | / _\` || '_ \\ | __|| || '_ \\  / _\` |
| || || (_| || | | || |_ | || | | || (_| |
|_||_| \\__, ||_| |_| \\__||_||_| |_| \\__, |
        __/ |                        __/ |
       |___/                        |___/ 

`;

require('colors')
function version(){
	console.log()
	console.log("v"+require("./package.json").version);
	console.log()
	console.log(lighting_str);
}

function help() {
	console.log()
	console.log('useage:' + 'light'.yellow + ' <command> ');
	console.log()
	console.log('commands:'.green);
	console.log('  create\tcreate the project');
	console.log('  gen\t\tgenerate the code of component and view');
	console.log('  release\tbuild and deploy your project');
	console.log('  server\tlaunch a static server');

	console.log()
	console.log('please use "light <command> -h" to check the help info;');

	console.log(lighting_str);
}
function main(argv){

	var cmdArg=argv[2];

	if(!cmdArg){
		cmdArg = '-h';
	}

	if(cmdArg === '-v' || cmdArg=== '--version'){
		version();
	}else if(cmdArg === '-h' || cmdArg=== '--help'){
		help();
	}else{
		light.require('command',cmdArg);
		light.commander.parse(argv);
	}
}

module.exports.run=main;
module.exports.light=light;
module.exports.api= function (cwd,cmd, options,logger) {
	if(logger){
		light.util.log=logger;
	}
	var action = require("./service/"+cmd).do;
	process.chdir(cwd);
	return action(null,options);
};