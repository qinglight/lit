var jres = require('../kernel'),
    _ = jres.util,
    cheerio = require('cheerio'),
    path = require("path");

//代码生成的业务逻辑，四种模板
exports.do = function (cmd, options) {
    var project = require(process.cwd() + '/project.json');

    _.glob("src/html/page/*.html", function (err, result) {
        _.forEach(result, function (page) {
            var $ = cheerio.load(_.readFileSync(page), {
                recognizeSelfClosing: true
            });

            //每个页面都要生成视图和register文件
            var template = require("./lib/"+(project.type||"light-0.1"));

            var views = $("view"),
                components = $("component"),
                register = "src/js/regist/" + path.parse(page).name + ".js";

            //每一次gen都要重新生成register文件
            if(_.exists(register)) _.del(register);

            _.forEach(views, function (view) {
                var attrs = _.merge({
                    async: false,
                    home: false,
                    parent:null
                }, view.attribs);

                var html = "src/html/view/" + attrs.id + ".html";
                var js = "src/js/view/" + attrs.id + ".js";

                if (!_.exists(html) || options.override) {
                    _.writeFileSync(html, template.html(attrs));
                    _.log("生成视图(html):" + attrs.id);
                } else {
                    _.log("视图(html)" + attrs.id + "已经存在,跳过代码生成,如需要强制覆盖,请添加-o选项");
                }

                if (!_.exists(js) || options.override) {
                    _.writeFileSync(js, template.js(attrs));
                    _.log("生成视图(js):" + attrs.id);
                } else {
                    _.log("视图(js)" + attrs.id + "已经存在,跳过代码生成,如需要强制覆盖,请添加-o选项");
                }

                //追加register信息
                if(!_.exists(register)) {
                    _.writeFileSync(register, template.register(attrs));
                }else{
                    _.appendFileSync(register, template.register(attrs));
                }
            });
        })
    });
};