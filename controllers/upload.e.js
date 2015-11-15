/**
 * Created by nana on 2015/10/27.
 */
var multiparty = require('multiparty');
var ALI = require("aliyun-sdk");
module.exports = function (app) {
    app.post("/rest/upload", function (req, res) {
        var form = new multiparty.Form();
        //下载后处理
        form.parse(req, function (err, fields, files) {
            "use strict";
            var file = files.file[0];
            if (file / 1024 > 500) {
                res.status(500).send("文件大小不能超过500K");
                return;
            }
            if (!/^.+\.(gif|jpg|jpeg|png)$/gi.test(file.originalFilename)) {
                res.status(500).send("只能上传图片文件，允许的图片格式为：gif|jpg|jpeg|png");
                return;
            }
            if (file / 1024 > 500) {
                res.status(500).send("文件大小不能超过500K");
                return;
            }
            var oss = new ALI.OSS({
                accessKeyId: "DGp93cpGeQD5axzf",
                secretAccessKey: "LbNDWEQrldzjlYvVjeLGZmRkWb6cGc",
                securityToken: "",
                endpoint: 'http://oss-cn-hangzhou.aliyuncs.com',
                apiVersion: '2013-10-15'
            });
            var fs = require('fs');
            fs.readFile(file.path, function (err, data) {
                if (err) {
                    res.status(500).send(err);
                    return;
                }
                var date = new Date();
                var key = date.toLocaleDateString() + "/" + date.getTime() + file.originalFilename.substring(file.originalFilename.lastIndexOf('.'));
                oss.putObject({
                        Bucket: 'ismartjs',
                        Key: key,
                        Body: data,
                        AccessControlAllowOrigin: '',
                        CacheControl: 'no-cache',
                        ContentDisposition: file.originalFilename,
                        ContentEncoding: 'utf-8',
                        ServerSideEncryption: 'AES256',
                        Expires: null
                    },
                    function (err, data) {

                        if (err) {
                            res.status(500).send(err);
                            return;
                        }
                        res.send('"http://ismartjs.oss-cn-hangzhou.aliyuncs.com/' + key + '"');
                    });
            });
        });
    });
}