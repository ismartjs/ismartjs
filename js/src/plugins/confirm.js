/**
 * Created by Administrator on 2014/6/26.
 */
(function ($) {

    Smart.fn.extend({
        confirm: function (msg, level, option) {
            if (level && $.type(level) !== 'string') {
                option = level;
                level = null;
            }
            var deferred = $.Deferred();
            var dialog = Smart.UI.template("confirm");
            var DEFAULT_OPTION = {title: "提示", sureBtnName: "确定", cancelBtnName: "取消"};
            option = $.extend(DEFAULT_OPTION, option || {});
            if ($.type(option) == "string") {
                option = $.extend($.extend({}, DEFAULT_OPTION), {sign: option});
            }
            var levelSign = (level || 'info').split(":");
            level = "s-confirm-" + levelSign[0];
            var sign = levelSign.length == 2 ? levelSign[1] : "s-confirm-sign-default";
            dialog.addClass(level);
            $("*[s-confirm-role='title']", dialog).html(option.title);
            $("*[s-confirm-role='message']", dialog).html(msg);
            $("*[s-confirm-role='sign']", dialog).addClass(sign);
            var sureBtn = $("*[s-confirm-role='sureBtn']", dialog).html(option.sureBtnName);
            var cancelBtn = $("*[s-confirm-role='cancelBtn']", dialog).html(option.cancelBtnName);
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
            }).on("shown.bs.modal", function () {
                sureBtn.focus();
            }).css('zIndex', Smart.UI.zIndex()).modal({
                keyboard: false,
                backdrop: false
            });

            return deferred;
        }
    });
})(jQuery);