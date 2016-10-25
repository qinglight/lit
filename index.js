var light = require('./kernel');
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

function version(){
	console.log();
	console.log("v"+require("./package.json").version);
	console.log();
	console.log(lighting_str);
}

function help() {
	console.log();
	console.log('useage:' + 'light'.yellow + ' <command> [option]');
	console.log();
	console.log('commands:'.green);
	console.log('  create\t生成工程的基本目录结构和模板文件');
	console.log('  gen\t\t代码生成');
	console.log('  release\t代码的集成打包');
	console.log('  server\t内置HTTP服务器');
	console.log('  plugin\t插件的安装卸载更新');

	console.log();
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
		light.commander.parse(argv);
	}
}

module.exports.run=main;