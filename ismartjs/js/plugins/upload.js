/**
 * Created by Administrator on 2014/7/2.
 */
(function(){

    var uploadListener = {

        setTarget: function(node){
            this.node = node;
        },
        onBegin: function(){
            this.progress = Smart.UI.template("progress")
                .css({
                    "position": "absolute",
                    zIndex: Smart.UI.zIndex()
                }).addClass("s-ui-upload-progressbar");
            this.progress.width(this.node.innerWidth());
            this.progress.appendTo("body");
            this.progressbar = this.progress.children();
        },
        onProgress: function(percent, total, loaded){
            this.progress.position({
                of: this.node,
                at: "left bottom+5",
                my: "left top"
            });
            this.progressbar.width(percent+"%");
        },
        onDone: function(){
            var that = this;
            setTimeout(function(){
                that.progress.fadeOut(function(){$(this).remove();});
            }, 1500);
        }
    };

    Smart.extend({
        uploadSetting: function(setting){
            setting = setting || {};
            if(setting.listener) uploadListener = setting.listener;
        }
    });

    //上传文件
    Smart.fn.extend({
        "upload": function(url, fileNode, listener){
            var formData = Smart.formData(fileNode);
            listener = listener || uploadListener;
            if($.isFunction(listener)){
                listener = {
                    onProgress: listener
                };
            }
            listener.setTarget && listener.setTarget(fileNode);
            listener.onBegin && listener.onBegin();
            return this.post(url, formData, null, null, {
                xhr: function(){
                    var xhr = $.ajaxSettings.xhr();
                    xhr.upload.addEventListener("progress", function(e){
                        if (e.lengthComputable) {
                            var percentComplete = e.loaded * 100 / e.total;
                            listener.onProgress(parseInt(percentComplete), e.total, e.loaded);
                        }
                    }, false);
                    return xhr;
                }
            }).always(function(){
                listener.onDone && listener.onDone();
            });

        }
    });

})();