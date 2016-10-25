/**
 * 代码生成
 * @param cmd
 * @param options
 */
exports.do = function (cmd, options) {
    var _ = require('../kernel').util,
        cheerio = require('cheerio'),
        project;

    //代码生成的业务逻辑，四种模板
    if(_.existsSync("project.json")){
        project = require(process.cwd() + '/project.json');
    }else{
        _.log("error","请在light工程的根目录中执行此命令");
        process.exit(-1);
    }

    _.glob("src/html/page/*.html", function (err, result) {
        _.forEach(result, function (page) {
            var $ = cheerio.load(_.readFileSync(page), {
                recognizeSelfClosing: true
            });

            //每个页面都要生成视图和register文件
            var template = require("./lib/"+(project.type||"light-0.1"));

            var views = $("view"),
                components = $("component"),
                register = "src/js/regist/" + _.parse(page).name + ".js";

            //每一次gen都要重新生成register文件
            if(_.existsSync(register)) _.removeSync(register);

            _.forEach(views, function (view) {
                var attrs = _.merge({
                    async: false,
                    home: false,
                    parent:null
                }, view.attribs);

                var html = "src/html/view/" + attrs.id + ".html";
                var js = "src/js/view/" + attrs.id + ".js";

                if (!_.existsSync(html) || options.override) {
                    _.outputFileSync(html, template.html(attrs));
                    _.log("info","生成视图(html):" + attrs.id);
                } else {
                    _.log("info","视图(html)" + attrs.id + "已经存在,跳过代码生成,如需要强制覆盖,请添加-o选项");
                }

                if (!_.existsSync(js) || options.override) {
                    _.outputFileSync(js, template.js(attrs));
                    _.log("info","生成视图(js):" + attrs.id);
                } else {
                    _.log("info","视图(js)" + attrs.id + "已经存在,跳过代码生成,如需要强制覆盖,请添加-o选项");
                }

                //追加register信息
                if(!_.existsSync(register)) {
                    _.outputFileSync(register, template.register(attrs));
                }else{
                    _.outputFileSync(register, template.register(attrs),{
                        flag:"a"
                    });
                }
            });
        })
    });
};