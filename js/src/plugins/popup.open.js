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

    var createBtn = function (btn) {
        var button = $('<button class="btn" type="button"></button>');
        btn.id && button.attr("s-dialog-btn-id", btn.id);
        var text = (btn.icon ? "<i class='" + btn.icon + "'></i> " : "") + btn.name;
        button.html(text);
        btn.style && button.addClass(btn.style || "btn-default");
        if(btn.disabled){
            button.prop("disabled", true);
        }
        if(btn.hidden){
            button.hide();
        }
        button.click(function () {
            button.prop("disabled", true);
            var rs = btn.click.call(this);
            if (Smart.isDeferred(rs)) {
                rs.always(function () {
                    button.prop("disabled", false);
                })
            } else {
                button.prop("disabled", false);
            }
        });
        btn.hidden && button.hide();
        return button;
    };

    var showDialog = function (dialog, zIndex) {
        dialog.on('shown.bs.modal', function (e) {

        }).on("hide.bs.modal", function (e) {
            if (this == e.target)
                Smart.UI.backdrop(false);
        }).css('zIndex', zIndex).modal({
            keyboard: false,
            backdrop: false
        });
    };

    var popupOpen = function () {
        var deferred = $.Deferred();
        var dialog = Smart.UI.template("dialog");
        var node = $("<div s='window' />");
        var nodeSmart = Smart.of(node);
        var bodyNode = $("*[s-dialog-role='body']", dialog);
        var bodySmart = Smart.of(bodyNode);
        var titleNode = $("*[s-dialog-role='title']", dialog);
        var footerNode = $("*[s-dialog-role='footer']", dialog);
        var closeBtn = $("*[s-dialog-role='close']", dialog);
        var dialogMain = $("*[s-dialog-role='dialog']", dialog);

        bodySmart.setNode(node);

        closeBtn.click(function () {
            nodeSmart.close();
        });
        Smart.UI.backdrop();
        var zIndex = Smart.UI.zIndex();
        nodeSmart.on("close", function (e) {
            var eDeferred = e.deferred;
            var args = Smart.SLICE.call(arguments, 1);
            dialog.on("hidden.bs.modal", function () {
                eDeferred.resolve();
                dialog.remove();
                deferred.resolve.apply(deferred, args);
            });
            dialog.modal('hide');
            e.deferred = eDeferred.promise();
        }).on("meta", function (e, key, value) {
            if (key == "title") {
                titleNode.html(value);
            }
        }).on("s-loaded", function () {
            titleNode.html(nodeSmart.meta.title || DIALOG_DEFAULT_TITLE);
            var focusBtn;
            if (nodeSmart.meta.btns) {
                footerNode.empty();
                $.each(nodeSmart.meta.btns, function (i, btn) {
                    var btnNode = createBtn(btn);
                    if (btn.focus) {
                        focusBtn = btnNode;
                    }
                    footerNode.append(btnNode);
                });
            } else {
                //如果底部没有按钮，则进行隐藏
                footerNode.hide();
            }

            nodeSmart.meta.height && node.height(nodeSmart.meta.height);
            nodeSmart.meta.width && node.width(nodeSmart.meta.width);
            //这里主要处理内容的高度
            dialogMain.css({"position": "absolute", "width": "auto"});
            bodyNode.css("padding", 0).css("position", "relative");
            dialog.appendTo("body");
            dialog.show();
            dialogMain.width(dialogMain.innerWidth()).css("position", "relative");
            footerNode.css("marginTop", "0");
            dialog.on('shown.bs.modal', function (e) {
                focusBtn && focusBtn.focus();
            })
            showDialog(dialog, zIndex);
        }).on("dialog.btn.disable", function (e, id) {
            getButtonById(id).prop("disabled", true);
        }).on("dialog.btn.enable", function (e, id) {
            getButtonById(id).prop("disabled", false);
        });

        function getButtonById(id) {
            return $("button[s-dialog-btn-id='" + id + "']", footerNode);
        }

        nodeSmart.getButtonById = getButtonById;
        nodeSmart.load.apply(nodeSmart, $.makeArray(arguments)).fail(function (e, xhr) {
            var msg;
            if (xhr.status == 0) {
                msg = "网络异常，请重试";
                Smart.UI.backdrop(false);
                nodeSmart.toast(msg, "danger");
                e.stopPropagation();
            }
        });

        return $.extend(deferred, {
            close: function () {
                nodeSmart.close();
            }
        });
    };

    Smart.fn.extend({
        popupOpen: popupOpen,
        /**
         * @duplicate
         * */
        dialogOpen: function () {
            Smart.warn("dialogOpen 已经过时，请使用popupOpen代替。");
            return popupOpen.apply(this, Smart.SLICE.call(arguments));
        }
    });
})(jQuery);
