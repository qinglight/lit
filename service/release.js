var cheerio = require("cheerio"),
    express = require("express"),
    chokidar = require('chokidar'),
    useref = require('useref'),
    io = require('socket.io'),
    UglifyJS = require('uglify-js'),
    archiver = require('archiver'),
    watch=false;

var res_suffix_map = {};

/**
 * release命令
 * @param options
 */
var task = function (options) {

    if(options.product){
        options.suffix = true;
        options.uglify = true;
        options.concat = true;
    }


    var _  = require("../kernel").util;

    //1. 先要让应用可跑，然后增加新特性
    _.removeSync("dist");
    _.copySync("src","dist");

    /**
     * 2. 搬迁所有的html/page下的文件到根目录
     */
    var files = _.glob.sync("dist/html/page/*");
    files.forEach(function (file) {
        var dist = _.join("dist",_.parse(file).base);
        _.renameSync(file,dist);
    });

    /**
     * 3. 组装视图->组件->snippet
     */
    //TODO: 只支持根目录下的一级目录
    files = _.glob.sync("dist/*.html");
    files.forEach(function (file) {
        var content = _.readFileSync(file).toString().replace(/\r\n/ig,"\n");//处理换行符

        var injectScript = [];

        var $ = cheerio.load(content,{
            recognizeSelfClosing:true,
            decodeEntities: false
        });

        //-------------视图-----------------
        var views = $("view");

        //处理dom节点间的父子关系
        var parent_child_map = {};

        injectScript.push('js/regist/'+_.parse(file).name+'.js');
        views.each(function (i,view) {
            var attr = view.attribs;

            //HTML
            parent_child_map[attr.id] = attr;
            var html = _.join("dist/html/view",attr.id+".html");
            if(_.existsSync(html)){
                $(view).replaceWith(_.readFileSync(html).toString());
            }

            //JS
            //js要区分是否为异步视图
            var js = _.join("dist/js/view",attr.id+".js");
            if(_.existsSync(js) && !attr.async){
                // 向inject:view区域添加script标签
                injectScript.push('js/view/'+attr.id+'.js');
            }
        });

        //处理dom节点间的父子关系
        //TODO :父子关系这里有个大坑，视图的定义上必须是子视图vue先new，否则就完蛋了
        _.each(parent_child_map,function (v,k) {
            if(v.parent){
                // 当一个视图内包含多个sub-view的dom节点时,只有最靠近前面的一个生效
                // 因为，当存在多级视图时，无法准确的知道组装顺序
                $("#"+_.camel(v.parent)).find("sub-view").first().append($("#"+_.camel(k)))
            }
        });

        //-------------组件-----------------
        var components = $("component");


        //-------------片段-----------------
        var snippets = $("snippet");
        snippets.each(function (i,snippet) {
            var attr = snippet.attribs;

            var html = _.join("dist/html/snippet",attr.id+".html");
            if(_.existsSync(html)){
                $(snippet).replaceWith(_.readFileSync(html).toString());
            }
        });

        content = $.html().replace(/sub\-view/ig,"div");

        // 处理脚本注入
        var spiltedContent = content.split(/<!--\s*inject:view\s*-->\s*<!--\s*endinject\s*-->/ig);
        if(spiltedContent.length > 2){
            _.log("inject:view注解在每个页面只能有一个");
            process.exit(-1);
        }else if(spiltedContent.length == 2){
            var scripts = [];
            scripts.push("<script type='text/javascript' src='"+injectScript.shift()+"'></script>");
            injectScript.reverse().forEach(function (script) {
                scripts.push("<script type='text/javascript' src='"+script+"'></script>");
            });
            content = spiltedContent[0] + scripts.join("\n") + spiltedContent[1];
        }


        /**
         * 4. 代码的合并，优化，压缩
         */
        var userefParse = useref(content.replace(/\r\n/ig,"\n"),{noconcat:!(options.concat||options.uglify)});//useref只认识LF的bug，需要再次转换一下分页符号
        var result = userefParse[1];
        content = userefParse[0];

        if(options.concat || options.uglify){
            var js = result.js;
            for(var dist_js in js){
                var dist_js_content = "";
                var res = js[dist_js].assets;
                res.forEach(function (r) {
                    dist_js_content += _.readFileSync(_.join("dist",r)).toString()+"\n";
                });

                if(options.uglify){
                    dist_js_content = UglifyJS.minify(dist_js_content,{fromString:true}).code;
                }

                _.writeFileSync(_.join("dist",dist_js),dist_js_content);
            }

            var css = result.css;
            for(var dist_css in css){
                var dist_css_content = "";
                var res = css[dist_css].assets;
                res.forEach(function (r) {
                    dist_css_content += _.readFileSync(_.join("dist",r)).toString();
                });

                if(options.uglify){
                    dist_css_content = dist_css_content.replace(/\s/ig,"");
                }

                _.writeFileSync(_.join("dist",dist_css),dist_css_content);
            }
        }


        /**
         * 5. 添加反缓存的后缀策略
         */
        $ = cheerio.load(content,{
            recognizeSelfClosing:true,
            decodeEntities: false,
            normalizeWhitespace: true,
        });

        if(options.suffix){
            $("link").each(function (i, o) {
                var src = o.attribs.href;
                if(src&&!/^(http:\/\/)|(https:\/\/)|(\/\/).*$/i.test(src)){

                    var tmp = /([^\/]{1,})\.([^\.]{1,})$/i.exec(src);

                    var dist = null;
                    if(res_suffix_map[src]){
                        dist = res_suffix_map[src];
                    }else{
                        dist = src.replace(/([^\/]{1,})\.([^\.]{1,})$/i,tmp[1]+"_"+new Date().getTime()+"."+tmp[2]);
                        if(_.existsSync("dist/"+src)){
                            _.renameSync("dist/"+src,"dist/"+dist);
                        }
                    }

                    o.attribs.href = dist;
                    res_suffix_map[src] = dist;
                }
            });

            $("script").each(function (i, o) {
                var src = o.attribs.src;
                if(src&&!/^(http:\/\/)|(https:\/\/)|(\/\/).*$/i.test(src)){

                    var tmp = /([^\/]{1,})\.js$/i.exec(src);

                    var dist = null;
                    if(res_suffix_map[src]){
                        dist = res_suffix_map[src];
                    }else{
                        dist = src.replace(/([^\/]{1,})\.js$/i,tmp[1]+"_"+new Date().getTime()+".js");
                        if(_.existsSync("dist/"+src)){
                            _.renameSync("dist/"+src,"dist/"+dist);
                        }
                    }

                    o.attribs.src = dist;
                    res_suffix_map[src] = dist;
                }
            });
            res_suffix_map = {};
        }

        _.writeFileSync(file,$.html());
    });


    /**
     * 6. 将资源文件打包成zip包
     */
    if(options.pack){
        var project = require(process.cwd()+'/project.json');
        zipDir("dist",project.project+"-"+project.version+".zip");
    }

    //-----------------------------我是检查分割线--------------------------------------------------
    if(watch) return;
    else watch = true;


    var sockets = [];
    if(options.brower){
        /**
         * 4. 开启server
         */
        var app = express();
        var port = options.brower === true?3000:options.brower;
        var server = require('http').Server(app);
        app.get(["**/*\.html","/"],function (req, res) {
            var path = req.path;
            if(path=="/"){
                path = "/index.html";
            }
            res.set('Content-Type', 'text/html');
            var html = _.readFileSync(_.join("dist",path)).toString();
            // html+="<script src='http://cdn.socket.io/socket.io-1.4.5.js'></script>";
            // html+="<script>var socket = io();socket.on('reload', function (data) {console.log(data);location.reload()});</script>";
            io((server)).on('connection', function (socket) {
                sockets.push(socket);
            });
            res.send(new Buffer(html));
            res.end();
        });
        app.use(express.static('dist'));
        server.listen(port);

        /**
         * 打开浏览器
         */
        var exec = require('child_process').exec,
            cmd;
        switch (process.platform) {
            case 'wind32':
                cmd = 'start';
                break;

            case 'linux':
                cmd = 'xdg-open';
                break;

            case 'darwin':
                cmd = 'open';
                break;
        }
        exec(cmd + " http://localhost:" + port);
    }


    if(options.watch){
        /**
         * 5. 开启watch
         */
        chokidar.watch('src', {ignored: /[\/\\]\./}).on('change', (event, path) => {
            task(options);
            sockets.forEach(function (sockets) {
                sockets.emit('reload', true);
            })
        });
    }
};


function zipDir(dir,dist) {
    var _ = require("../kernel").util;
    _.remove(dist,function () {
        var output = _.createWriteStream(dist);
        var archive = archiver('zip');

        output.on('close', function() {
            _.log("info",archive.pointer() + ' total bytes');
            _.log("info",'archiver has been finalized and the output file descriptor has closed.');
        });

        archive.on('error', function(err) {
            throw err;
        });

        archive.pipe(output);

        var files = _.glob.sync(dir+"/**/*");
        files.forEach(function (file) {
            if(_.statSync(file).isFile()) archive.append(_.createReadStream(file), { name: file.replace(dir+"/","") })
        });

        archive.finalize();
    });
}

exports.do = task;