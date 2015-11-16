var express = require("./lib/express");
express.config({
    rootDir: __dirname + "/controllers",
    port: "5050"
});

var dao = require("./lib/db")(require("./db.config.js"));
require("./lib/model").dao(dao);

var bodyParser = require('body-parser');

express.appConfig(function (app, express) {
    app.engine('.html', require('ejs').__express);
    app.set('view engine', 'html');
    app.set('views', './');
    app.use(bodyParser.urlencoded());
    app.use(bodyParser());
    app.use(function (req, res, next) {
        var path = req.path;
        if (/^\/rest\/.+$/g.test(path)) {
            next();
            return;
        }
        if (path == "/") {
            path = "ismartjs/default.html";
        } else {
            path = "ismartjs/" + path;
        }
        if (path.indexOf(".html") != -1) {
            res.render(path);
        } else {
            res.sendFile(path, {root: __dirname });
        }
    });
});
express.start();