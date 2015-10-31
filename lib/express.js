/**
 * Created by Administrator on 2014/7/9.
 */
var express = require('express');
var app = express();
var utils = require('./utils');
var path = require('path');
var fs = require('fs');
var config = {
    rootDir: null,
    expressPath: "./",
    port: "80",
    ext: ".e.js"
};

var started = false;

module.exports = {
    config: function (cfg) {
        utils.extend(config, cfg);
        return this;
    },
    start: function () {
        if (started) {
            console.warn("已经启动，不能再次启动");
            return;
        }
        //加载controller
        this._loadControllers();
        app.listen(config.port);
        started = true;
    },
    //设置app
    appConfig: function (fn) {
        fn(app, express);
    },
    _loadControllers: function (cPath) {
        cPath = cPath || config.expressPath;
        var dir = path.join(config.rootDir, cPath);
        var files = fs.readdirSync(dir);
        var that = this;
        files.forEach(function (file) {
            var stat = fs.lstatSync(path.join(dir, file));
            if (stat.isDirectory()) {
                that._loadControllers(path.join(cPath, file));
                return;
            }
            if(file.slice(-config.ext.length) != config.ext){
                return;
            }
            require(path.join(config.rootDir, cPath, file))(app);
        });
    }
}
