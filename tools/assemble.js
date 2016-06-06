var through = require('through2');
var _ = require('../kernel').util;
var config = require('../kernel').config;
var cheerio = require('cheerio');
var File = require('gulp-util').File;
var project = _.exists(process.cwd()+'/project.json')?require(process.cwd()+'/project.json'):{};

/**
 * 主要是组装html代码,引入模板和视图资源,包括组件的js个视图资源
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
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

    //视图
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

    // if($("script[light-attr-type=regist]").length==0){
    //   regist.appendTo($("body"));
    // }
    _.forEach(views, function (view) {
      var attrs = view.attribs;
      if(project.type=="angular"){
        _.exists(config.src+"/html/view/"+attrs.id+".html")?_.copyFileSync(config.src+"/html/view/"+attrs.id+".html",config.dist+"/html/view/"+attrs.id+".html"):_.copyFileSync(config.tmp+"/html/view/"+attrs.id+".html",config.dist+"/html/view/"+attrs.id+".html");
      }else{
        $(view).replaceWith(_.exists(config.src+"/html/view/"+attrs.id+".html")?_.readFileSync(config.src+"/html/view/"+attrs.id+".html"):_.readFileSync(config.tmp+"/html/view/"+attrs.id+".html"));
      }

      var view_js = script.clone().attr("src","js/view/"+attrs.id+".js");
      $("script[light-attr-type=regist]").after(view_js);
    });


    //组件
    var components = $("component");
    _.forEach(components, function (component) {
      var attrs = component.attribs;
      $(component).replaceWith(_.exists(config.src+"/html/component/"+attrs.id+".html")?_.readFileSync(config.src+"/html/component/"+attrs.id+".html"):_.readFileSync(config.tmp+"/html/component/"+attrs.id+".html"));

      var component_js = script.clone().attr("src","js/component/"+attrs.id+".js");
      $("script[light-attr-type=regist]").after(component_js);
    });

    //代码片段
    var snippets = $("snippet");
    _.forEach(snippets, function (snippet) {
      var attrs = snippet.attribs;
      $(snippet).replaceWith(_.exists(config.src+"/html/snippet/"+attrs.id+".html")?_.readFileSync(config.src+"/html/snippet/"+attrs.id+".html"):_.readFileSync(config.tmp+"/html/snippet/"+attrs.id+".html"));
    });

    file.contents = new Buffer($.html());
    this.push(file)
    cb();
  });
}

module.exports = assemble;