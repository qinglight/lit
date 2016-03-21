var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var HtmlDom = require('htmldom');
var _ = require('../kernel').util;
var jade = require("jade");

const PLUGIN_NAME = 'gulp-light-assemble';

function assemble(options) {
  return through.obj(function(file, enc, cb) {
    if (file.isNull()) {
      return cb(null, file);
    }
    if (file.isBuffer()) {
      //组装html页面
      var html = new HtmlDom(file.contents);
      var views = html.$("view");
      var snippets = html.$("snippet");
      var templates = html.$("script[type=text/template][src]");

      _.forEach(templates,function(template){
        var tpls = template.attributes.src.split(",");
        _.forEach(tpls,function(tpl){
          html.$("script[src]").eq(-1).after('<script type="text/javascript" src="template/'+tpl+'.js"></script>');
        });
         html.$(template).remove();
      })

      if(views.length>0){
        var filename = file.path.split("/").pop().split("\.")[0];
        html.$("script[src]").eq(-1).after('<script type="text/javascript" src="js/regist/'+filename+'.js"></script>');

        _.forEach(views,function(view){
          var attrs = view.attributes;
          var viewCode = "";
          var filebase = options.views+"/"+attrs.id+".";
          if(_.exists(filebase+"html")){
            viewCode = _.readFileSync(filebase+"jade").toString()
            viewCode = jade.compile(viewCode)();
          }else if(_.exists(filebase+"jade")){
            viewCode = re
          }else{
            _.log("视图"+attrs.id+"不存在!");
          }

          html.$(view).after(viewCode);
          html.$(view).remove();

          //引入js资源
          html.$("script[src]").eq(-1).after('<script type="text/javascript" src="js/view/'+attrs.id+'.js"></script>');
        });
      }

      _.forEach(snippets,function(snippet){
        var attrs = snippet.attributes;

        var snippetCode = "";
        var filebase = options.snippets+"/"+attrs.id+".";
        if(_.exists(filebase+"html")){
          snippetCode = _.readFileSync(filebase+"html").toString()
        }else if(_.exists(filebase+"jade")){
          snippetCode = _.readFileSync(filebase+"jade").toString();
          snippetCode = jade.compile(snippetCode)();
        }else{
          _.log("代码片段"+attrs.id+"不存在!");
        }

        html.$(snippet).after(snippetCode);
        html.$(snippet).remove();
      });

      

      var content = html.stringify();
      if(options.beautify){
        content = html.beautify();
      }
      file.contents = new Buffer(content);
    }
    if (file.isStream()) {

    }

    cb(null, file);
  });
}

module.exports = assemble;