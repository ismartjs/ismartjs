/**
 * Created by Administrator on 2014/6/26.
 */
(function ($) {

    var ALERT_LEVEL = {
        warning: {
            sign: "fa fa-exclamation-triangle",
            color: "text-warning"
        },
        info: {
            sign: "fa fa-info-circle",
            color: "text-info"
        },
        success: {
            sign: "fa fa-check-circle",
            color: "text-success"
        },
        danger: {
            sign: "fa fa-times-circle",
            color: "text-danger"
        }
    };
    var DEFAULT_LEVEL = ALERT_LEVEL.warning;

    Smart.fn.extend({
        confirm: function (msg, option) {
            var deferred = $.Deferred();
            var dialog = Smart.UI.template("confirm");
            var DEFAULT_OPTION = {title: "提示", sureBtnName: "确定", cancelBtnName: "取消", sign: "info"};
            option = $.extend(DEFAULT_OPTION, option || {});
            if ($.type(option) == "string") {
                option = $.extend($.extend({}, DEFAULT_OPTION), {sign: option});
            }
            var confirmLevel = ALERT_LEVEL[option.sign] || DEFAULT_LEVEL;

            $("*[s-ui-confirm-role='title']", dialog).html(option.title);
            $("*[s-ui-confirm-role='message']", dialog).html(msg);
            $("*[s-ui-confirm-role='sign']", dialog).addClass(confirmLevel.color).addClass(confirmLevel.sign);
            var sureBtn = $("*[s-ui-confirm-role='sureBtn']", dialog).html(option.sureBtnName);
            var cancelBtn = $("*[s-ui-confirm-role='cancelBtn']", dialog).html(option.cancelBtnName);
            Smart.UI.backdrop();
            var selectVal = 0;
            sureBtn.click(function () {
                selectVal = 1;
                dialog.modal('hide');
            });
            cancelBtn.click(function () {
                selectVal = 0;
                dialog.modal('hide');
            });
            $(dialog).on("hide.bs.modal", function () {
                Smart.UI.backdrop(false).done(function () {
                    deferred[selectVal ? 'resolve' : 'reject']();
                });
            }).on("hidden.bs.modal", function () {
                $(this).remove();
            }).css('zIndex', Smart.UI.zIndex()).modal({
                keyboard: false,
                backdrop: false
            });

            return deferred;
        }
    });
})(jQuery);