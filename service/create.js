var jres = require('../kernel'),
    _ = jres.util,
    prompt = require("prompt"),
    colors = require("colors"),
    ncp = require('ncp').ncp;

prompt.message = colors.green("Lighting");
prompt.delimiter = colors.green(":");
ncp.limit = 16;

exports.do = function (directory, options) {
    var properties = {
        name: {
            description: colors.red("您的工程名名字是什么?".bgWhite),
            default: "light"
        },
        version: {
            description: colors.green("您的工程版本是什么?".bgWhite),
            default: "0.0.1"
        },
        description: {
            description: colors.blue("请简单描述一下当前的工程?".bgWhite),
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
        _.extend(options, result);


        var projectCb = function () {
            ncp(require("path").join(__dirname, "..", "scaffold", options.type || 'light'), options.name, function (err) {

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

                if (options.callback) {
                    options.callback();
                }
            });
        };

        //目录已经存在，且非强制删除
        if (_.exists(options.name) && !options.force) {
            prompt.get({
                properties: {
                    del: {
                        description: colors.red("指定目录已经存在，是否删除y/n（提示：删除后不可撤销）?".bgWhite),
                        default: "n"
                    }
                }
            }, function (err, r) {
                if (r.del != "y" && r.del != "Y") {
                    _.log("指定目录已经存在，创建无法继续，请更话目录后重试！");
                    return;
                }

                _.del(options.name, function () {
                    projectCb();
                });
            })
        }else {
            projectCb();
        }
    });
};

function doReplace(file, op) {
    var conetnt = _.readFileSync(file);

    conetnt = conetnt.replace(/\$name\$/ig, op['name']);
    conetnt = conetnt.replace(/\$desc\$/ig, op['desc']);
    conetnt = conetnt.replace(/\$version\$/ig, op['version']);

    _.writeFileSync(file, conetnt);
};