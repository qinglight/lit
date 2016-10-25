var jres = require('../../kernel'),
    _ = jres.util;

var html = `
<div id="<%=camel(id,'/')%>" style="display:none;"></div>
`;

var js = `
;(function(){
  App.defineViewModel("#<%=camel(id,'/')%>",{
       data:{},
       watch:{},
       methods:{}
     },{
     beforeRender:function () {
     }
  });
})();
`;

var register =  `
App.registerView({
    path:"/<%=id%>",
    el:"#<%=camel(id,'/')%>",
    home:<%=home%><%if(parent){%>,
    parent:"#<%=camel(parent,'/')%>"<%}%><%if(async){%>,
    async:"<%=async%>"<%}%>
});
`;

var func_register = _.template(register);
var func_html = _.template(html);
var func_js = _.template(js);

function camel(str,split) {
    var d = str.split(split);
    str = d[0];
    for(i=1;i<d.length;i++){
        str+=d[i][0].toUpperCase()+d[i].substring(1)
    }
    return str;
}

exports.register = function (data) {
    return func_register(_.extend(data,{camel:camel}))
};

exports.html = function (data) {
    return func_html(_.extend(data,{camel:camel}))
};

exports.js = function (data) {
    return func_js(_.extend(data,{camel:camel}))
};