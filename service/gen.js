var jres = require('../kernel'),
	_ = jres.util,
    project = require(process.cwd()+'/project.json');


exports.do = function(cmd,options) {
  var tpls = {
    "light":{
      view:_.template(`
<div id="<%=id%>" style="display:none;"></div>
      `),
      regist:_.template(`
<%for(var view in views){%>
App.registView("<%=views[view].id%>",new App.View({
  el:"#<%=views[view].id%>",
  model:new App.Model()
}),<%=views[view].home%>);
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
    <%for(var i in views){var view = views[i];%>
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

  var H= require('htmldom');
  _.glob("src/html/page/*.html",function(err,result){
    _.forEach(result,function(page){
      var tpl = tpls[project.type||"light"];

      var filename = _.normalizePath(page).split("/").pop().split("\.")[0];
      var regist = "src/js/regist/"+filename+".js";
      var views = new H(_.readFileSync(page)).$("view");
      var viewsAttrs = {
        views:[]
      };
      _.forEach(views,function(view){
        var attrs = _.merge({
          async:false,
          home:false
        },view.attributes);

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
  })
}