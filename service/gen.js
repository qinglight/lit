var jres = require('../kernel'),
	_ = jres.util;


exports.do = function(cmd,options) {
  
  var viewHtmlTpl = _.template(`
    <div id="<%=id%>" style="display:none;"></div>
  `);
  var viewJsTpl = _.template(`
    /**
     * VIEW <%=id%>
     * @param  {[type]} $ [description]
     * @return {[type]}   [description]
     */
    ;(function(){
      App.<%=id%>View.wrap({
        beforeRender:function(){
          //TODO
          return true;
        },
        ready:function(){
          //TODO
        },
        afterUnRender:function(){
        }
      });
    })();
  `);

  var registTpl=_.template(`
    <% 
    if(async=="true" || async==true){
      whichview = "AsyncView";  
    }else{
      whichview = "View";
    }
    %>
    App.registView("<%=id%>",new App.<%=whichview%>({
      el:"#<%=id%>",
      model:new App.Model()
    }),<%=home%>);
  `);

  //代码生成
  //读取html下page的内容,读取view标签
  var H= require('htmldom');
  _.glob("src/html/page/*.html",function(err,result){
    _.forEach(result,function(page){
      //清除regist的内容
      var filename = _.normalizePath(page).split("/").pop().split("\.")[0];
      _.writeFileSync("src/js/regist/"+filename+".js","");

      var views = new H(_.readFileSync(page)).$("view");
      _.forEach(views,function(view){
        var attrs = _.merge({
          async:false,
          home:false
        },view.attributes);

        var html = "src/html/view/"+attrs.id+".html";
        var js = "src/js/view/"+attrs.id+".js";
        var regist = "src/js/regist/"+filename+".js";

        if(!_.exists(html)||options.overide){
           _.writeFileSync(html,viewHtmlTpl(attrs));
           _.log("生成视图(html):"+attrs.id);
        }else{
          _.log("视图(html)"+attrs.id+"已经存在,跳过代码生成,如需要强制覆盖,请添加-o选项");
        }

        if(!_.exists(js)||options.overide){
          _.writeFileSync(js,viewJsTpl(attrs));
          _.log("生成视图(js):"+attrs.id);
        }else{
          _.log("视图(js)"+attrs.id+"已经存在,跳过代码生成,如需要强制覆盖,请添加-o选项");
        }

        _.writeFileSync(regist,_.readFileSync(regist)+registTpl(attrs));
      });
    })
  })
}