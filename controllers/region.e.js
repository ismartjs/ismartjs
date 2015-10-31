/**
 * Created by Administrator on 2014/7/11.
 */
module.exports = function (app) {

    var Region = require("../models/region");
    app.get("/rest/regions/:parentId", function (req, res) {
        Region.queryBuilder().select("*").add("parent_id = ?", req.params.parentId)
            .notEmpty(req.query.name, "name like '%" + req.query.name + "%'", false).order("id asc")
            .list().done(function (rs) {
                res.send(rs);
            });
    });

    app.delete("/rest/region", function (req, res) {
        var ids = req.body.ids;
        var deferredFns = [];
        Utils.each(ids, function (i, id) {
            deferredFns.push(function (dao) {
                Region.branch(dao).deleteById(id);
            });
        });
        Region.dao.transactionQueue(deferredFns).done(function () {
            res.send(true);
        });
    });

    app.post("/rest/region", function (req, res) {
        var region = Region.of(req.body);
        region.checkId().fail(function () {
            res.send({
                code: 0,
                msg: "id已经存在"
            });
        }).done(function () {
            region.save().done(function () {
                res.send({
                    code: 1
                });
            }).fail(function () {
                res.send({
                    code: 0
                });
            })
        });
    });

    app.put("/rest/region/:id", function (req, res) {
        var region = Region.of(req.body);
        region.data.id = req.params.id;
        region.update().done(function () {
            res.send({code: 1})
        }).fail(function () {
            res.send({code: 0})
        });

    });

};