/**
 * Created by Administrator on 2014/7/18.
 */
var fileDir;
module.exports = {
    setDir: function(dir){
        fileDir = dir;
    },
    abspath: function(path){
        return (fileDir + path).replace(/\/{2,}/g,"/");
    }
}