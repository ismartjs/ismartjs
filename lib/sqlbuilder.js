/**
 * Created by Administrator on 2014/7/10.
 */

var utils = require("./utils");

function SqlBuilder(table){
    this.params = [];
    this.sqls = [];
    this.orders = [];
    this.table = table;
    this.selectSql = null;
}

SqlBuilder.prototype = {
    reset: function(){
        this.params = [];
        this.sqls = [];
        this.orders = [];
        this.selectSql = null;
        this.countSelectSql = null;
        delete this.pageNumber;
        delete this.pageSize;
        delete this.limit;
        return this;
    },
    select: function(selectSql){
        this.selectSql = "select " + selectSql;
        return this;
    },
    countSelect: function(sql){
        this.countSelectSql = "select " + sql;
        return this;
    },
    page: function(pageNumber, pageSize){
        this.pageNumber = pageNumber;
        return this;
    },
    limit: function(limitCount){
        this.limitCount = limitCount;
        return this;
    },
    notNull: function(val, sql, paramFlag){
        if(utils.isNull(val)) return this;
        this.sqls.push(sql);
        paramFlag && this.params.push(val);
        return this;
    },
    notEmpty: function(val, sql, paramFlag){
        if(paramFlag == null) paramFlag = true;
        if(utils.isEmpty(val)) return this;
        if(Array.isArray(val)){
            var inSql = [];
            utils.each(val, function(){
                inSql.push("?");
                this.params.push(this);
            });
            sql = sql.replace(":in", inSql.join(","));
            this.sqls.push(sql);
            return this;
        }
        this.sqls.push(sql);
        paramFlag && this.params.push(val);
        return this;
    },
    gt: function(val, eqVal, sql){
        if(val < eqVal) return this;
        this.sqls.push(sql);
        this.params.push(val);
        return this;
    },
    lt: function(val, eqVal, sql){
        if(val > eqVal) return this;
        this.sqls.push(sql);
        this.params.push(val);
        return this;
    },
    notEq: function(val, eqVal, sql){
        if(val == eqVal) return this;
        this.sqls.push(sql);
        this.params.push(val);
        return this;
    },
    eq: function(val, eqVal, sql){
        if(val != eqVal) return this;
        this.sqls.push(sql);
        this.params.push(val);
        return this;
    },
    add : function(sql, param){
        this.sqls.push(sql);
        if(param != null) this.params.push(param);
        return this;
    },
    order: function(order){
        this.orders.push(order);
        return this;
    },
    build: function(){
        var sql = this.sqls.join(" and ");
        var fullSql = [];

        if(this.selectSql){
            fullSql.push(this.selectSql);
        }

        this.table && fullSql.push("from " + this.table);
        if(!Utils.isEmpty(sql)){
            fullSql.push("where");
            fullSql.push(sql);
        }
        if(this.orders.length){
            fullSql.push("order by");
            fullSql.push(this.orders.join(","));
        }
        if("pageNumber" in this && this.pageNumber != null){
            var start = (this.pageNumber - 1) * this.pageSize;
            fullSql.push("limit " + start + "," + this.pageSize);
        } else if("limitCount" in this && this.limitCount != null){
            fullSql.push("limit " + this.limitCount);
        }
        return fullSql.join(" ");
    },
    buildCount: function(){
        var sql = this.sqls.join(" and ");
        var fullSql = [];

        if(this.countSelectSql){
            fullSql.push(this.countSelectSql);
        }

        this.table && fullSql.push("from " + this.table);
        if(!Utils.isEmpty(sql)){
            fullSql.push("where");
            fullSql.push(sql);
        }

        return fullSql.join(" ");
    }
}

module.exports = SqlBuilder;