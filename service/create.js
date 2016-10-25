var  prompt = require("prompt");

prompt.message = "Lighting".green;
prompt.delimiter = ":".green;


exports.do = function (directory, options) {

    //依赖于初始化完成后的kernel
    var  _ = require('../kernel').util;

    ['name','description','version','type','force'].forEach(function (key) {
       if(typeof options[key] == "function"){
           options[key] = null;
       }
    });

    var properties = {
        name: {
            description: "您的工程名名字是什么?",
            default: "light"
        },
        version: {
            description: "您的工程版本是什么?",
            default: "0.0.1"
        },
        description: {
            description: "请简单描述一下当前的工程?",
            default: "Just For Fun"
        }
    };

    //初始化信息
    options.name = options.name || directory;

    //补全未填充属性
    for (var k in properties) {
        if (options[k]) {
            delete properties[k];
        }
    }

    prompt.get({
        properties: properties
    }, function (err, result) {
        // 参数设置完毕
        _.extend(options, result);


        //检查参数
        ['name','description','version'].forEach(function (k) {
            if(!options[k]){
                _.log("error"," %s 不允许为空",k)
                process.exit(-1);
            }
        });

        var projectCb = function () {
            _.copy(_.join(__dirname, "..", "scaffold", options.type || 'light'), options.name, function (err) {

                doReplace(options.name + "/project.json", {
                    name: options.name,
                    version: options.version,
                    desc: options.description
                });

                doReplace(options.name + '/src/html/page/index.html', {
                    name: options.name,
                    version: options.version,
                    desc: options.description
                });
            });
        };

        //目录已经存在，且非强制删除
        if (_.existsSync(options.name) && !options.force) {
            prompt.get({
                properties: {
                    del: {
                        description: "指定目录已经存在，是否删除y/n（提示：删除后不可撤销）?".red,
                        default: "n"
                    }
                }
            }, function (err, r) {
                if (r.del != "y" && r.del != "Y") {
                    _.log("info","指定目录已经存在，创建无法继续，请更话目录后重试！");
                    process.exit(0);
                }

                _.remove(options.name, function () {
                    projectCb();
                });
            })
        }else {
            projectCb();
        }
    });

    function doReplace(file, op) {
        var content = _.readFileSync(file).toString();


        content = content.replace(/\$name\$/ig, op['name']);
        content = content.replace(/\$desc\$/ig, op['desc']);
        content = content.replace(/\$version\$/ig, op['version']);

        _.writeFileSync(file, content);
    }
};