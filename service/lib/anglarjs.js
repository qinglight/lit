var jres = require('../kernel'),
    _ = jres.util;

var html = `
<div class="row" view="<%=id%>">
    <div class="col-xs-12"></div>
</div>
`;

var js = `
;(function(){
  app.controller('<%=id%>',function($scope,$http,API){

  });
})();
`;

var register =  `
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
`;

exports.html = _.template(html);
exports.js = _.template(js);
exports.register = _.template(register);