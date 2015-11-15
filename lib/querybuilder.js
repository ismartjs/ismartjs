var SqlBuilder = require("./sqlbuilder");
var Class = require("./class");
var Q = require("q");
var QueryBuilder = Class(function (table, dao) {
    this.dao = dao;
    this.SUPER(table);
}, SqlBuilder, {
    list: function () {
        var sql = this.build();
        return this.dao.query(sql, this.params);
    },
    paging: function () {
        var countSql = this.buildCount();
        var sql = this.build();
        var deferred = Q.defer();
        var total;
        var that = this;
        var result;
        var deferredFns = [
            function (dao) {
                return dao.count(countSql, that.params).then(function (t) {
                    total = t;
                });
            },
            function (dao) {
                return dao.query(sql, that.params).then(function (rs) {
                    result = rs;
                });
            }
        ];
        var promise = this.dao.transactionQueue(deferredFns);
        promise.done(function () {
            var obj = {
                page: that.pageNumber,
                pageSize: that.pageSize,
                results: result,
                total: total
            };
            deferred.resolve(obj);
        });
        promise.fail(function () {
            deferred.reject();
        });
        return deferred.promise;
    }
});
module.exports = QueryBuilder;