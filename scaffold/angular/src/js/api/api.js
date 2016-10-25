;(function () {

  app.service('API',function ($http) {
    

    function _execute(func,params,callback){
      $http({
        method:'GET',
        url:"",
        params:angular.extend(params,{
        })
      }).success(callback);
    }
  })
})();