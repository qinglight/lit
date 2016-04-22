var light = require('./kernel');
var art = require('ascii-art');
	
require('colors')
function version(){
	console.log()
	console.log("v"+require("./package.json").version);
	console.log()
	art.font('lighting', 'Doom', function(rendered){
	    console.log(art.style(rendered, ''));
	});
}

function help(){
	console.log()
	console.log('useage:'+'light'.yellow+' <command> ');
	console.log()
	console.log('commands:'.green);
	console.log('  create\tcreate the project');
	console.log('  gen\t\tgenerate the code of component and view');
	console.log('  release\tbuild and deploy your project');
	console.log('  server\tlaunch a static server');

	console.log()
	console.log('please use "light <command> -h" to check the help info;');
	art.font('lighting', 'Doom', function(rendered){
	    console.log(art.style(rendered, ''));
	});
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
module.exports.api= function (cwd,cmd, options) {
	var action = require('./service/'+cmd).do;
	process.chdir(cwd);
	action(null,options);
};