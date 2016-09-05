/**
 * release命令
 * @param options
 */
exports.do = function (options) {
    var _  = require("../kernel").util;

    //1. 先要让应用可跑，然后增加新特性
    _.removeSync("dist");
    _.copySync("src","dist");


        _.glob("dist/html/page/*",function (err,files) {
            files.forEach(function (file) {
                var dist = _.join("dist",_.parse(file).base);
                _.move(file,_.join("dist",_.parse(file).base),function () {
                    new Promise(function (resolve, reject) {
                        resolve(dist)
                    }).then(function (data) {


                        console.log(data)
                    });
                })
            })
        });
};