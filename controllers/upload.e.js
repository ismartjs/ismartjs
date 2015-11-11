/**
 * Created by nana on 2015/10/27.
 */
var multiparty = require('multiparty');
module.exports = function(app){
    app.post("/rest/upload", function(req, res){
        var form = new multiparty.Form();
        //下载后处理
        form.parse(req, function(err, fields, files) {
            "use strict";
            var file = files.file[0];
            res.send({
                name: file.originalFilename,
                size: file.size,
                serverPath: file.path
            });
        });
    });
}