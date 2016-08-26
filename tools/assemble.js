var through = require('through2');
var _ = require('../kernel').util;
var config = require('../kernel').config;
var cheerio = require('cheerio');
var File = require('gulp-util').File;
var project = _.exists(process.cwd()+'/project.json')?require(process.cwd()+'/project.json'):{};

/**
 * 主要是组装html代码,引入模板和视图资源,包括组件的js个视图资源
 */
function assemble(options) {

  return through.obj(function(file, enc, cb) {
    file = new File({
      cwd: file.cwd,
      base: file.base,
      path: file.path,
      contents: file.contents
    });

    var $ = cheerio.load(file.contents,{
      recognizeSelfClosing:true
    });

    var views = $("view");
    var script = $("\n<script type='text/javascript'></script>");
    var filename = file.stem||file.basename.split("\.")[0];
    var regist = script.clone().attr("src","js/regist/"+filename+".js").attr("light-attr-type","regist");

    _.forEach($("html").contents(), function (node) {
      if(node.type=="comment"&&node.data.trim()=="inject:view"){
        $(node.next.next).remove();
        $(node).replaceWith(regist);
      }
    });
    _.forEach($("body").contents(), function (node) {
      if(node.type=="comment"&&node.data.trim()=="inject:view"){
        $(node.next.next).remove();
        $(node).replaceWith(regist);
      }
    });

    /**
     * 处理视图
     */
    var parent_child_map = {};
    _.forEach(views, function (view) {
      var attrs = view.attribs;
      parent_child_map[attrs.id] = attrs;

      if(project.type=="angular"){
        if(_.exists(config.tmp+"/html/view/"+attrs.id+".html")){
          _.copyFileSync(config.tmp+"/html/view/"+attrs.id+".html",config.dist+"/html/view/"+attrs.id+".html")
        }else{
          _.log("请先运行light gen 生成基本代码 !")
        }
      }else{
        if(_.exists(config.tmp+"/html/view/"+attrs.id+".html")){
          $(view).replaceWith(_.readFileSync(config.tmp+"/html/view/"+attrs.id+".html"))
        }else{
          _.log("请先运行light gen 生成基本代码 !")
        }
      }

      var view_js = script.clone().attr("src","js/view/"+attrs.id+".js");
      $("script[light-attr-type=regist]").after(view_js);
    });

    _.each(parent_child_map,function (v,k) {
      if(v.parent){
        $("#"+_.camel(v.parent)).find("sub-view").append($("#"+_.camel(k)))
      }
    });


    /**
     * 处理组件
     */
    var components = $("component");
    _.forEach(components, function (component) {
      var attrs = component.attribs;
      if(_.exists(config.tmp+"/html/component/"+attrs.id+".html")){
        $(component).replaceWith(_.readFileSync(config.tmp+"/html/component/"+attrs.id+".html"));
      }else{
        _.log("请先运行light gen 生成基本代码 !")
      }

      var component_js = script.clone().attr("src","js/component/"+attrs.id+".js");
      $("script[light-attr-type=regist]").after(component_js);
    });

    /**
     * 处理代码片段
     */
    var snippets = $("snippet");
    _.forEach(snippets, function (snippet) {
      var attrs = snippet.attribs;
      if(_.exists(config.tmp+"/html/snippet/"+attrs.id+".html")){
        $(snippet).replaceWith(_.readFileSync(config.tmp+"/html/snippet/"+attrs.id+".html"))
      }else{
        _.log("您引入的代码片段不存在请检查!")
      }
    });

    file.contents = new Buffer($.html());
    this.push(file)
    cb();
  });
}

module.exports = assemble;