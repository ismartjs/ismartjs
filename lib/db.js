/**
 * Created by Administrator on 2014/7/11.
 */

module.exports = function(cfg, globalName){

    var mysql = require("./mysql");
    mysql.config(cfg);
    return mysql.dao;

}