var jres = require('./kernel'),
	pkg = jres.about;
	
require('colors')
function version(){
	console.log()
	console.log("========= v"+pkg.version+" =========");
}

function help(){
	console.log()
	console.log('useage:'+'light'.yellow+' <command> OR '+'jres/jresplus'.yellow+' <command>');
	console.log()
	console.log('commands:'.green);
	console.log('  create\tcreate the project');
	console.log('  gen\t\tgenerate the code of component and view');
	console.log('  release\tbuild and deploy your project');
	console.log('  server\tlaunch a static server');

	console.log()
	console.log('please use "light <command> -h" to check the help info;');
}
function main(argv){

	var cmdArg=argv[2];

	if(cmdArg === '-v' || cmdArg=== '--version'){
		version();
	}else if(cmdArg === '-h' || cmdArg=== '--help'){
		help();
	}else{
		jres.require('command',cmdArg);
		jres.commander.parse(argv);
	}
}

module.exports.run=main;