/**
 * Created by nana on 2015/11/14.
 */
var model = require("../lib/model");
var QueryBuilder = require("../lib/querybuilder");
var User = model.register(
    {
        table: "user",
        columns: ['id', 'username', 'age', 'gender', 'avatar', 'phone', 'address', 'city_id', 'province_id',
            'district_id', 'create_time', 'update_time', 'password', 'status']
    },
    {},
    {//static method
        findById: function (parentId) {
            var sql = "select * from user where id = ?";
            return this.dao.query(sql, [parentId]);
        },
        search: function (p) {
            var queryBuilder = new QueryBuilder(" `user` as u left join region as province on province.id " +
                "= u.province_id left join region as city on city.id = u.city_id left join region as district on district.id = u.district_id ", User.dao);
            queryBuilder.select("u.*, province.name as provinceName, city.name as cityName, district.name as districtName ");
            queryBuilder.page(p.page, p.pageSize);
            queryBuilder.notEmpty(p.username, "username like '%" + p.username + "%'", false);
            queryBuilder.notEmpty(p.phone, "phone = ?");
            queryBuilder.notEmpty(p.gender, "gender = ?");
            queryBuilder.notEmpty(p.city_id, "city_id = ?");
            queryBuilder.notEmpty(p.province_id, "province_id = ?");
            queryBuilder.notEmpty(p.district_id, "district_id = ?");
            queryBuilder.notEmpty(p.status, "u.status = ?");
            queryBuilder.order(p.order);
            return queryBuilder.paging();
        },
        checkUsername: function (username, excludeId) {
            var params = [username];
            var sql = "select count(1) from user where username = ? ";
            if (excludeId) {
                sql += ' and id <> ?';
                params.push(excludeId);
            }
            return this.dao.count(sql, params);
        }
    }
);
module.exports = User;
