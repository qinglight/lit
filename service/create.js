var jres = require('../kernel'),
		_ = jres.util,
		path = require('path');


var types = {
  blank:"scaffold",
  angular:"scaffold-angularjs",
  demo:"master",
  f7:"scaffold-f7"
}

exports.do = function(directory,options){
	directory = directory || ".";
	
	var scaffold = new (require('fis-scaffold-kernel'))({
    type: 'github',
    log: {
        writer: 'stdout',
        level: 0 
    }
  });

  var Promise = require("bluebird");
  var chain = Promise.resolve();
  chain.then(function(){
    return new Promise(function (resolve) {
      //名字
      if(!options.name){
        scaffold.prompt([
          {
            description: '您的工程名名字是什么?',
            default: 'light',
            name:"name"
          }
        ], function (err, results) {
          options.name = results.name;
          resolve();
        })
      }else{
        resolve();
      };
    })
  }).then(function(){
    return new Promise(function (resolve) {
      //描述
      if(!options.description){
        scaffold.prompt([
          {
            description: '这个工程是干什么用的呢?',
            default: 'just for fun',
            name:"desc"
          }
        ], function (err, results) {
          options.description = results.desc;
          resolve()
        })
      }else{
        resolve();
      };
    })
  }).then(function(){
    return new Promise(function (resolve) {
      //描述
      if(!options.version){
        scaffold.prompt([
          {
            description: '需要指定一下版本号吗?',
            default: '0.0.1',
            name:"version"
          }
        ], function (err, results) {
          options.version = results.version;
          resolve()
        })
      }else{
        resolve();
      };
    })
  }).then(function(){
    return new Promise(function (resolve) {
      //类型
      /*if(!options.type){
        scaffold.prompt([
          {
            description: '您希望使用是么开发技术栈?',
            default: 'light',
            name:"type"
          }
        ], function (err, results) {
          options.type = results.type;
          resolve();
        })
      }else{
        resolve();
      };*/
      resolve();
    })
  }).then(function(){
    return new Promise(function (resolve) {
      if(_.exists(directory)){
        scaffold.prompt([
          {
            description: directory+'目录已经存在,需要删除(不可撤销)后继续吗?',
            default: 'N',
            name:"moveon"
          }
        ], function (err, results) {
          if(results.moveon!="N"){
            initProject();
          }
        })
      }else{
        initProject();
      }

      function initProject(){
        var branch  = types[options.type||'blank'];

        scaffold.download('wyub/light-dev-demo@'+branch, function (err, temp_path) {
          
          scaffold.deliver(temp_path, directory, []);

          doReplace(directory+"/project.json",{
            name:options.name,
            desc:options.description
          })

          doReplace(directory+'/src/html/page/index.html',{
            name:options.name,
            desc:options.description
          })
        });
      }
    })
  })
}

function doReplace(file,op){
  var conetnt = _.readFileSync(file);

  conetnt = conetnt.replace(/\$name\$/ig,op['name']);
  conetnt = conetnt.replace(/\$desc\$/ig,op['desc']);

  _.writeFileSync(file,conetnt);
}