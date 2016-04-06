var jres = require('../kernel'),
	_ = jres.util,
    project = require(process.cwd()+'/project.json'),
  Book = require('gitbook').Book;;


exports.do = function(cmd,options) {
  var tpls = {
    "light":{
      view:_.template(`
<div id="<%=id%>" style="display:none;"></div>
      `),
      regist:_.template(`
<%for(var i=0;i<views.length;i++){%>
App.registView("<%=views[i].id%>",new App.View({
  el:"#<%=views[i].id%>",
  model:new App.Model()
}),<%=views[i].home%>);
<%}%>
      `),
      js:_.template(`
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
      `)
    },
    "angular":{
      view:_.template(`
<div class="row" view="<%=id%>">
    <div class="col-xs-12"></div>
</div>
      `),
      regist:_.template(`
;(function(){
  var app = angular.module('app', ['ngRoute'])
  app.config(function ($routeProvider){
    $routeProvider
    <%var home;%>
    <%for(var i=0;i<views.length;i++){var view = views[i];%>
      .when('/<%=view.id%>', {
          controller: '<%=view.id%>',
          templateUrl: 'html/view/<%=view.id%>.html'
      })
      <%if(view.home) home=view%>
    <%}%>
      .otherwise({
          redirectTo: '/<%=view.id%>'
      });
  })
  window.app = app;
})();
      `),
      js:_.template(`
;(function(){
  app.controller('<%=id%>',function($scope,$http,API){

  });
})();
      `)
    }
  }

  var cheerio = require('cheerio');
  _.glob("src/html/page/*.html",function(err,result){
    _.forEach(result,function(page){
      var tpl = tpls[project.type||"light"];

      var filename = page.split(new RegExp("[\\|/]")).pop().replace("\.html","");
      var regist = "src/js/regist/"+filename+".js";

      var $ = cheerio.load(_.readFileSync(page),{
        recognizeSelfClosing:true
      })
      var views = $("view");
      var viewsAttrs = {
        views:[]
      };
      _.forEach(views,function(view){
        var attrs = _.merge({
          async:false,
          home:false
        },view.attribs);

        viewsAttrs.views.push(attrs);

        var html = "src/html/view/"+attrs.id+".html";
        var js = "src/js/view/"+attrs.id+".js";

        if(!_.exists(html)||options.overide){
           _.writeFileSync(html,tpl.view(attrs));
           _.log("生成视图(html):"+attrs.id);
        }else{
          _.log("视图(html)"+attrs.id+"已经存在,跳过代码生成,如需要强制覆盖,请添加-o选项");
        }

        if(!_.exists(js)||options.overide){
          _.writeFileSync(js,tpl.js(attrs));
          _.log("生成视图(js):"+attrs.id);
        }else{
          _.log("视图(js)"+attrs.id+"已经存在,跳过代码生成,如需要强制覆盖,请添加-o选项");
        }
      });
      _.writeFileSync(regist,tpl.regist(viewsAttrs));
    })
  });

  if(options.withDoc){
    //创建文档目录
    var initRoot = 'src/doc';
    Book.init(initRoot);
  }
}