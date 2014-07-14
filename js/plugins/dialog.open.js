/**
 * Created by Administrator on 2014/6/25.
 */
(function ($) {
    /**
     * btn的定义
     * {
     *      id: "",
     *      name: "",
     *      click: function(){},
     *      style: "",
     *      icon: ""
     * }
     * */
    var DIALOG_DEFAULT_TITLE = "对话框";

    var createBtn = function(btn){
        var button = $('<button class="btn" type="button"></button>');
        btn.id && button.attr("s-ui-dialog-btn-id", btn.id);
        var text = (btn.icon ? "<i style='"+btn.icon+"'></i>" : "") + btn.name;
        button.html(text);
        btn.style && button.addClass(btn.style || "btn-default");
        button.click(btn.click);
        return button;
    };

    var showDialog = function(dialog){
        Smart.UI.backdrop();
        dialog.on("hide.bs.modal", function(){
            Smart.UI.backdrop(false);
        }).css('zIndex', Smart.UI.zIndex()).modal({
            keyboard: false,
            backdrop: false
        });
    };

    Smart.fn.extend({
        dialogOpen: function () {
            var deferred = $.Deferred();
            var dialog = Smart.UI.template("dialog");
            var node = $("<div s='window' />");
            var nodeSmart = Smart.of(node);
            var bodyNode = $("*[s-ui-dialog-role='body']", dialog);
            var bodySmart = Smart.of(bodyNode);
            var titleNode = $("*[s-ui-dialog-role='title']", dialog);
            var footerNode = $("*[s-ui-dialog-role='footer']", dialog);
            var closeBtn = $("*[s-ui-dialog-role='close']", dialog);
            var dialogMain = $("*[s-ui-dialog-role='dialog']", dialog);

            bodySmart.setNode(node);

            closeBtn.click(function(){
                nodeSmart.closeWithConfirm();
            });

            nodeSmart.on("close", function(e){
                var eDeferred = e.deferred;
                var args = Smart.SLICE.call(arguments, 1);
                dialog.on("hidden.bs.modal", function(){
                    eDeferred.resolve();
                    dialog.remove();
                    deferred.resolve.apply(deferred, args);
                });
                dialog.modal('hide');
                e.deferred = eDeferred.promise();
            }).on("load", function(){
                titleNode.html(nodeSmart.meta.title || DIALOG_DEFAULT_TITLE);
                if(nodeSmart.meta.btns){
                    $.each(nodeSmart.meta.btns, function(i, btn){
                        footerNode.append(createBtn(btn));
                    });
                }

                nodeSmart.meta.height && node.height(nodeSmart.meta.height);
                nodeSmart.meta.width && node.width(nodeSmart.meta.width);
                //这里主要处理内容的高度
                dialogMain.css("position","absolute");
                dialog.appendTo("body");
                dialogMain.width(dialog.innerHeight()).css("position","relative");

                showDialog(dialog);
            }).on("dialog.btn.disable", function(e, id){
                getButtonById(id).prop("disabled", true);
            }).on("dialog.btn.enable", function(e, id){
                getButtonById(id).prop("disabled", false);
            });

            function getButtonById(id){
                return $("button[s-ui-dialog-btn-id='"+id+"']", footerNode);
            }

            nodeSmart.load.apply(nodeSmart, $.makeArray(arguments));

            return deferred;
        }
    });
})(jQuery);
