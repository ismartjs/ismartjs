/**
 * Created by Administrator on 2014/7/11.
 */
module.exports = function (app) {

    var User = require("../models/user");
    app.get("/rest/users", function (req, res) {
        User.search(req.query).done(function (rs) {
            res.send(rs);
        });
    });

    app.get("/rest/user/checkUsername", function (req, res) {
        User.checkUsername(req.query.username, req.query.id).done(function (count) {
            if (count != 0) {
                res.send({code: 0, msg: '用户名已经存在'});
            } else {
                res.send({code: 1});
            }
        });
    });

    app.get("/rest/user/:id", function (req, res) {
        User.getById(req.params.id).done(function (rs) {
            res.send(rs);
        });
    });

    app.delete("/rest/user/:ids", function (req, res) {
        var ids = req.params.ids.split(",");
        var deferredFns = [];
        Utils.each(ids, function (i, id) {
            deferredFns.push(function (dao) {
                User.branch(dao).deleteById(id);
            });
        });
        User.dao.transactionQueue(deferredFns).done(function () {
            res.send(true);
        });
    });

    app.post("/rest/user", function (req, res) {
        var user = User.of(req.body);
        User.checkUsername(user.data.username).done(function (count) {
            if (count != 0) {
                res.status(500).send('用户名已经存在');
            } else {
                user.data.create_time = new Date();
                user.data.update_time = new Date();
                user.save().then(function () {
                    res.send(user);
                },function () {
                    res.send(false);
                })
            }

        });
    });

    app.put("/rest/user/:id", function (req, res) {
        var user = User.of(req.body);
        user.data.id = req.params.id;
        User.checkUsername(user.data.username, user.data.id).done(function (count) {
            if (count != 0) {
                res.status(500).send('用户名已经存在');
            } else {
                user.data.update_time = new Date();
                user.update().done(function () {
                    User.getById(req.params.id).done(function(user){
                        res.send(user);
                    })
                },function () {
                    res.send(false)
                })
            }

        });
    });

};