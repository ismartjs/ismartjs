/**
 * Created by Administrator on 2014/7/11.
 * 基础的model，其他所有的model都应该继承自该model
 */
var Class = require("./class");
var Model = function (data, dao) {
    this.data = data;
    this.dao = dao;
};
var getMetaByObject = function (obj) {
    return obj.constructor.meta;
};
var SqlBuilder = require("./sqlbuilder");
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
        var deferred = Utils.Deferred();
        var total;
        var that = this;
        var result;
        var deferredFns = [
            function (dao) {
                return dao.count(countSql, that.params).done(function (t) {
                    total = t;
                });
            },
            function (dao) {
                return dao.query(sql, that.params).done(function (rs) {
                    result = rs;
                });
            }
        ];
        this.dao.transactionQueue(deferredFns).done(function () {
            var obj = {
                page: that.pageNumber,
                pageSize: that.pageSize,
                results: result,
                total: total
            };
            deferred.resolve(obj);
        }).fail(function () {
            deferred.reject();
        });
        return deferred.promise();
    }
});

Utils.extend(Model, {
    branch: function (dao) {
        var copy = {};
        Utils.extend(copy, this);
        copy.dao = dao;
        return copy;
    },
    queryBuilder: function () {
        return new QueryBuilder(this.meta.table, this.dao);
    },
    paging: function (searchParam) {
        return this.dao.paging({
            page: req.params.page,
            pageSize: req.params.pageSize,
            sql: "from shop"
        }).done(function (rs) {
            res.send(rs);
        });
    },
    //读取一个
    one: function () {

    },
    getById: function (id, select) {
        var sql = "select " + (select || "*") + " from "
            + this.meta.table + " where " + this.meta.id.column + " = ?";
        return this.dao.query(sql, [id]);
    },
    of: function (data, dao) {
        var obj = new this(data, dao || this.dao);
        obj.constructor = this;
        return obj;
    },
    deleteById: function (id) {
        var sql = "delete from " + this.meta.table + " where " + this.meta.id.column + " = ?";
        this.dao.query(sql, id);
    }
});
Model.prototype = {
    save: function (igNull) {
        var meta = getMetaByObject(this);
        var sql = "insert into " + meta.table;
        var fieldsSql = [];
        var valuesSql = [];
        var params = [];
        Utils.each(this.data, function (key, value) {
            if (igNull && value == null) {
                return;
            }
            //TODO 这里不做字段校验，看情况以后修复
            fieldsSql.push(key);
            valuesSql.push("?");
            params.push(value);
        });
        sql += "(" + fieldsSql.join(",") + ") values(" + valuesSql.join(",") + ")";
        var that = this;
        return this.dao.query(sql, params).done(function (rs) {
            if (meta.id.auto) {
                that.data[meta.id.column] = rs.insertId;
            }
        });
    },
    update: function () {
        var meta = getMetaByObject(this);
        var sqls = ["update " + meta.table + " set "];
        var setSqls = [];
        var params = [];
        Utils.each(this.data, function (key, value) {
            if (key == meta.id.column) return;
            setSqls.push(key + " = " + "?");
            params.push(value);
        });
        sqls.push(setSqls.join(","));
        sqls.push("where " + meta.id.column + " = ?");
        params.push(this.data[meta.id.column]);
        return this.dao.transactionQuery(sqls.join(" "), params);
    },
    remove: function () {

    }
}
/**
 * meta的格式为
 * {
 *      table: "",
 *      id: {
 *          column: "id",
 *          auto: true
 *      },
 *      columns: {
 *          "id": {}
 *      }
 * }
 * */
var getIdCfg = function (cfg) {
    var idCfg = {
        column: "id",
        auto: true
    };
    if (!cfg) {
        return idCfg;
    }
    return Utils.extend(idCfg, cfg);
};
module.exports = {
    dao: function (dao) {
        Model.dao = dao;
    },
    register: function (meta, prototype, staticMethod) {

        if ("id" in meta) {
            //如果id是字符串，
            if (Utils.type(meta.id) == "string") {
                meta.id = getIdCfg({column: meta.id});
            } else {
                meta.id = getIdCfg(meta.id);
            }
        } else {
            meta.id = getIdCfg();
        }

        var obj = Class(Model, prototype, staticMethod);

        obj.meta = meta;
        return obj;
    }
}