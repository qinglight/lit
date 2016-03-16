var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var HtmlDom = require('htmldom');
var _ = require('../kernel').util;

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

      _.forEach(views,function(view){
        var attrs = view.attributes;
        var viewCode = _.readFileSync(options.views+"/"+attrs.id+".html").toString()

        html.$(view).after(viewCode);
        html.$(view).remove();

        //引入js资源
        html.$("script[src]").eq(-1).after('<script type="text/javascript" src="js/view/'+attrs.id+'.js"></script>');
      });

      _.forEach(snippets,function(snippet){
        var attrs = snippet.attributes;
        var snippetCode = _.readFileSync(options.snippets+"/"+attrs.id+".html").toString()

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