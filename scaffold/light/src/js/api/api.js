;(function(){
  API = window.API || {
    _execute:function(url,params,callback){
      $.get(url,params,callback);
    }      
  };
})();