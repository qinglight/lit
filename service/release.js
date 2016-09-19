var cheerio = require("cheerio"),
    express = require("express"),
    chokidar = require('chokidar'),
    useref = require('useref'),
    io = require('socket.io'),
    UglifyJS = require('uglify-js'),
    archiver = require('archiver'),
    child_process = require('child_process'),
    os = require("os");

var res_suffix_map = {},
    plugins = [],
    watch=false;

//插件初始化
//要完善整个工具的完整的生命周期
//插件分为两种，命令插件和release插件
//资源的预处理和后处理
function readPlugins() {
    var light = require("../kernel"),
        _ = light.util;

    var pluginsDir = _.join(os.homedir(),".lighting-plugins");

    if(_.existsSync(pluginsDir)){//查询有哪些插件并将插件初始化
        var ps = child_process.execSync("npm ls --parseable --depth=0", {
            cwd:pluginsDir
        }).toString().split("\n");

        ps.shift();//去除目录
        ps.pop();//去除最后的空格

        ps.forEach(function (plugin) {
            plugin = require(plugin);
            if(plugin.install) plugin.install(light);//安装插件成功
            plugins.push(plugin);
        })
    }
}

function callPlugin(stage,cb) {
    var light = require("../kernel"),
        _ = light.util;
    var ava = 0;
    plugins.forEach(function (plugin) {
        if(plugin[stage] && typeof plugin[stage] == "function"){
            _.log("info","阶段："+stage+"，调用插件"+plugin.pluginName +"开始");
            ava++;
            plugin[stage].call(plugin,light,function () {
                _.log("info","阶段："+stage+"，调用插件"+this.pluginName +"成功");
                ava--;
                if(ava==0) cb();
            });
        }
    });
    if(ava == 0) cb();
}

/**
 * release命令
 * @param options
 */
var task = function (options) {
    var light = require("../kernel"),
        _ = light.util;

    readPlugins();
    /**
     * 0. 准备
     */
    if(options.product){
        options.suffix = true;
        options.uglify = true;
        options.concat = true;
    }


    var promise = new Promise(function (resolve, reject) {
        /**
         * 1. 环境重置与初始化
         */
        _.log("info","清除dist目录");
        _.removeSync("dist");
        _.log("info","拷贝src目录到dist目录");
        _.copySync("src","dist");

        var files = _.glob.sync("dist/html/page/*");
        files.forEach(function (file) {
            var dist = _.join("dist",_.parse(file).base); //搬迁所有的html/page下的文件到根目录
            _.log("info","发现page文件："+file);
            _.renameSync(file,dist);
        });

        callPlugin("prepare",function () {
            resolve();
        });

    }).then(function () {
        /**
         * 2. 组装视图->组件->snippet
         * TODO: 只支持根目录下的一级目录
         */
        return new Promise(function (resolve, reject) {
            _.glob.sync("dist/*.html").forEach(function (file) {
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
                    _.log("info","发现并开始处理视图："+attr.id);

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
                components.each(function (i,component) {
                    var attr = component.attribs;
                    _.log("info","发现并开始处理组件："+attr.id);

                    //HTML
                    var html = _.join("dist/html/component",attr.id+".html");
                    if(_.existsSync(html)){
                        $(component).replaceWith(_.readFileSync(html).toString());
                    }

                    //JS
                    //js要区分是否为异步视图
                    var js = _.join("dist/js/component",attr.id+".js");
                    if(_.existsSync(js) && !attr.async){
                        // 向inject:view区域添加script标签
                        injectScript.push('js/component/'+attr.id+'.js');
                    }
                });


                //-------------片段-----------------
                var snippets = $("snippet");
                snippets.each(function (i,snippet) {
                    var attr = snippet.attribs;
                    _.log("info","发现并开始处理代码片段："+attr.id);

                    var html = _.join("dist/html/snippet",attr.id+".html");
                    if(_.existsSync(html)){
                        $(snippet).replaceWith(_.readFileSync(html).toString());
                    }
                });

                content = $.html().replace(/sub\-view/ig,"div");

                // 处理脚本注入
                _.log("info","处理inject:view");
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

                if(options.concat || options.uglify && result){
                    var js = result.js;
                    for(var dist_js in js){
                        _.log("info","合并并生成代码："+dist_js);
                        var dist_js_content = "";
                        var res = js[dist_js].assets;
                        res.forEach(function (r) {
                            dist_js_content += _.readFileSync(_.join("dist",r)).toString()+"\n";
                        });

                        if(options.uglify){
                            _.log("info","压缩并生成代码："+dist_js);
                            dist_js_content = UglifyJS.minify(dist_js_content,{fromString:true}).code;
                        }

                        _.writeFileSync(_.join("dist",dist_js),dist_js_content);
                    }

                    var css = result.css;
                    for(var dist_css in css){
                        _.log("info","合并并生成代码："+dist_css);
                        var dist_css_content = "";
                        var res = css[dist_css].assets;
                        res.forEach(function (r) {
                            _.log("info","压缩并生成代码："+dist_css);
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
                                    _.log("info","为"+src+"生成文件后缀"+dist);
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
                                    _.log("info","为"+src+"生成文件后缀"+dist);
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

                callPlugin("build",function () {
                    resolve();
                })
            });
        })
    }).then(function () {
        return new Promise(function (resolve, reject) {
            /**
             * 6. 将资源文件打包成zip包
             */
            if(options.pack){
                var project = require(process.cwd()+'/project.json');
                zipDir("dist",project.project+"-"+project.version+".zip");
            }

            callPlugin("packager",function () {
                resolve();
            })
        })
    }).then(function () {
        return new Promise(function (resolve, reject) {
            if(watch) resolve();
            else {
                watch = true;
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
                    chokidar.watch('src', {ignored: /[\/\\]\./}).on('change', function(event, path){
                        task(options);
                        sockets.forEach(function (sockets) {
                            sockets.emit('reload', true);
                        })
                    });
                }
            }
            _.log("info","lighting执行完毕")
            resolve();
        })
    }).catch(function (err) {
        _.log("error",err);
        process.exit(-1);
    });
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