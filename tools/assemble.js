var through = require('through2');
var HtmlDom = require('htmldom');
var _ = require('../kernel').util;

const PLUGIN_NAME = 'gulp-light-assemble';
/**
 * 主要是组装html代码,引入模板和视图资源,包括组件的js个视图资源
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
function assemble(options) {
  var root = process.cwd();

  return through.obj(function(file, enc, cb) {
    var html = new HtmlDom(file.contents);
    var views = html.$("view");
    var snippets = html.$("snippet");
    var templates = html.$("script[type=text/template][src]");
    var that = this;

    //引入模板资源
    _.forEach(templates,function(template){
      var tpls = template.attributes.src.split(",");
      _.forEach(tpls,function(tpl){
        html.$("script[src]").eq(-1).after('<script type="text/javascript" src="template/'+tpl+'.js"></script>');
      });
       html.$(template).remove();
    });

    //引入视图资源
    if(views.length>0){
      var filename = file.path.split("/").pop().split("\.")[0];
      html.$("script[src]").eq(-1).after('<script type="text/javascript" src="js/regist/'+filename+'.js"></script>');

      _.forEach(views,function(view){
        var attrs = view.attributes;
        if(options.type!="light"){
          if(_.exists(root+"/src/html/view/"+attrs.id+".html")){
            _.copyFileSync(root+"/src/html/view/"+attrs.id+".html",root+"/dist/html/view/"+attrs.id+".html");
          }

          if(_.exists(root+"/.tmp/html/view/"+attrs.id+".html")){
            _.copyFileSync(root+"/.tmp/html/view/"+attrs.id+".html",root+"/dist/html/view/"+attrs.id+".html");
          }
        }else{
          var viewCode = (function(){
            if(_.exists(root+"/src/html/view/"+attrs.id+".html")){
              return _.readFileSync(root+"/src/html/view/"+attrs.id+".html");
            }

            if(_.exists(root+"/.tmp/html/view/"+attrs.id+".html")){
              return _.readFileSync(root+"/.tmp/html/view/"+attrs.id+".html");
            }

            return "";
          })();

          html.$(view).after(viewCode);
        }
        html.$(view).remove();

        //引入js资源
        html.$("script[src]").eq(-1).after('<script type="text/javascript" src="js/view/'+attrs.id+'.js"></script>');
      });
    }

    //引入代码片段
    _.forEach(snippets,function(snippet){
      var attrs = snippet.attributes;

      var snippetCode = (function(){
        if(_.exists(root+"/src/html/snippet/"+attrs.id+".html")){
          return _.readFileSync(root+"/src/html/snippet/"+attrs.id+".html");
        }

        if(_.exists(root+"/.tmp/html/snippet/"+attrs.id+".html")){
          return _.readFileSync(root+"/.tmp/html/snippet/"+attrs.id+".html");
        }

        return "";
      })();

      html.$(snippet).after(snippetCode);
      html.$(snippet).remove();
    });

    file.contents = new Buffer(html.beautify());

    cb(null, file);
  });
}

module.exports = assemble;