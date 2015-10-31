var utils = require("./utils");
var mysql = require("mysql");
var Class = require("./class");
var Q = require("q");
var pool;
function Dao(connection){
    this.connection = connection;
}
Dao.prototype = {
    query: function (sql, params, connection) {
        var deferred = Q.defer();
        var promise = deferred.promise;
        function execute(connection){
            connection.query(sql, params, function (err, result, fields) {
                if (err) {
                    console.error(err);
                    deferred.reject(err);
//                    throw err;
                    return;
                }
                deferred.resolve(result, fields, err);
            });
        }
        connection = connection || this.connection;
        if(connection){
            execute(connection);
        } else {
            pool.getConnection(function (err, connection) {
                promise.then(function(){
                    connection.release();
                },function(){
                    connection.release();
                });
                execute(connection);
            })
        }
        return promise;
    },
    count: function(sql, params, connection){
        var deferred = Q.defer();
        this.query(sql, params, connection).then(function(rs){
            for(var key in rs[0]){
                deferred.resolve(rs[0][key]);
                return;
            }
        }).fail(function(){
            deferred.reject.apply(deferred, Utils.makeArray(arguments));
        });
        return deferred;
    },
    transactionQuery: function(sql, params){
        var deferred = Q.defer();
        var that = this;
        pool.getConnection(function(err, connection){
            connection.beginTransaction(function(err){
                if(err){
                    deferred.reject();
                    return;
                }
                that.query(sql, params, connection).then(function(result, fields, err){
                    try{
                        deferred.resolve(result, fields, err);
                        connection.commit();
                    } catch(e){
                        connection.rollback();
                        throw e;
                    }
                }).fail(function(){
                    connection.rollback();
                    deferred.reject();
                }).always(function(){
                    connection.release();
                });
            });
        });
        return deferred.promise;
    },
    paging: function (searchParam) {
        searchParam = utils.extend({
            page: 1,
            pageSize: 20,
            sql: "",
            select: "select *",
            countSql: "",
            order: "",
            params: []
        }, searchParam, true);
        var countSql = "select count(1) " + searchParam.countSql || searchParam.sql;
        var first = (searchParam.page - 1) * searchParam.pageSize;
        var selectSql = searchParam.select + " " + searchParam.sql + " "
            + (searchParam.order && " order by " + searchParam.order) + " limit " + first + "," + searchParam.pageSize;
        var that = this;
        var deferredFns = [
            function (paging) {
                return that.query(countSql, searchParam.params).then(function (rs) {
                    paging.total = rs[0]['count(1)'];
                });
            },
            function (paging) {
                return that.query(selectSql, searchParam.params).then(function (rs) {
                    paging.results = rs;
                });
            }
        ];
        return utils.queue(deferredFns, {page: searchParam.page, pageSize: searchParam.pageSize });
    },
    transactionQueue: function(deferredFns){
        var deferred = Q.defer();
        pool.getConnection(function(err, connection){
            connection.beginTransaction(function(err){
                if(err){
                    deferred.reject();
//                    throw err;
                    return;
                }
                var dao = new Dao(connection);
                Utils.queue(deferredFns, dao).then(function(){
                    connection.commit();
                    deferred.resolve();
                }).fail(function(){
                    connection.rollback();
                    deferred.reject();
                }).always(function(){
                    connection.release();
                });
            });
        });
        return deferred.promise;
    }
}

module.exports = {
    config: function(cfg){
        pool = mysql.createPool(utils.extend({
            port: "3306"
        }, cfg));
    },
    dao: new Dao()
};