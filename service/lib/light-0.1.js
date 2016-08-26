var jres = require('../../kernel'),
    _ = jres.util;

function camel(str,split) {
    var d = str.split(split);
    str = d[0];
    for(i=1;i<d.length;i++){
        str+=d[i][0].toUpperCase()+d[i].substring(1)
    }
    return str;
}

var html = `
<div id="<%=camel(id,'/')%>" style="display:none;"></div>
`;

var js = `
/**
 * VIEW <%=camel(id,'/')%>
 * @param  {[type]} $ [description]
 * @return {[type]}   [description]
 */
;(function(){
  App.<%=camel(id,'/')%>View.wrap({
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
`;

var register =  `
App.registView("<%=camel(id,'/')%>",new App.View({
  el:"#<%=camel(id,'/')%>",
  model:new App.Model()
}),<%=home%>);
`;

var func_register = _.template(register);
var func_html = _.template(html);
var func_js = _.template(js);

exports.register = function (data) {
    return func_register(_.extend(data,{camel:camel}))
};

exports.html = function (data) {
    return func_html(_.extend(data,{camel:camel}))
};

exports.js = function (data) {
    return func_js(_.extend(data,{camel:camel}))
};