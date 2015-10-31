/**
 * Created by Administrator on 2014/7/11.
 */
var model = require("../lib/model");
var Region = model.register(
    {
        table: "region",
        id: {auto: false},
        columns: ['id','name','parent_id','status']
    },
    {//prototype
        checkId: function(){
            var deferred = Utils.Deferred();
            var sql = "select count(1) from region where id = ?";
            this.dao.count(sql, [this.data.id]).done(function(count){
                deferred[count == 0 ? "resolve" : "reject"]();
            });
            return deferred.promise();
        }
    },
    {//static method
        findByParentId: function(parentId){
            var sql = "select * from region where parent_id = ?";
            return this.dao.query(sql, [parentId]);
        }
    }
);
module.exports = Region;