(function ($) {

    var DEFAULT_LEVEL = "primary";

    var HOLDTIME = 3000;

    var toastContainer = null;

    var TOAST_STACK = [];

    var CURRENT_TOAST;

    function pushToast(toast, holdTime){
        TOAST_STACK.push([toast, holdTime]);
        if(TOAST_STACK.length > 1){
            return;
        }
        holdToast();
    }

    function removeToast(toast) {
        toast.css("margin-bottom", "-" + toast.outerHeight() + "px");
        toast.addClass("out");
        setTimeout(function () {
            toast.remove();
        }, 300);
        TOAST_STACK.shift();
        if(TOAST_STACK.length){
            holdToast();
        }
    }

    function holdToast(){
        var toastInfo = TOAST_STACK[0];
        var toast = CURRENT_TOAST = toastInfo[0];
        if(toast.attr("_TOAST_STATUS_") == "DELETED"){
            TOAST_STACK.shift();
            holdToast();
            return;
        }
        var holdTime = toastInfo[1];
        var closeTimeout = setTimeout(function(){
            removeToast(toast);
        }, holdTime);
        toast.mouseover(function () {
            toast.css({
                opacity: 1,
                "transition": "all .2s ease-out"
            });
            window.clearTimeout(closeTimeout);
        }).mouseleave(function () {
            closeTimeout = setTimeout(function(){
                removeToast(toast);
            }, holdTime);
        });
    }

    Smart.fn.extend({
        notice: function (msg, level, config) {
            Smart.warn("S.toast已经过时，请使用S.toast替代");
            this.toast(msg, level, config);
        },
        toast: function (msg, level, holdTime) {
            if(level && $.type(level) !== 'string'){
                option = level;
                level = null;
            }
            if (!toastContainer) {
                toastContainer = $("<div />").addClass("s-toast-container").appendTo("body");
            }
            toastContainer.css("zIndex", Smart.UI.zIndex());
            holdTime = holdTime || HOLDTIME;
            var toastTpl = Smart.UI.template("toast");
            var levelSign = (level || DEFAULT_LEVEL).split(":");
            level = levelSign[0];
            var sign = levelSign.length == 2 ? levelSign[1] : "s-toast-sign-default";
            var toastLevel = "s-toast-" + (level || DEFAULT_LEVEL);
            $("*[s-toast-role='message']", toastTpl).html(msg);
            if(sign){
                $(".s-toast-sign", toastTpl).addClass(sign);
            }
            toastTpl.addClass(toastLevel).prependTo(toastContainer);
            setTimeout(function () {
                toastTpl.addClass("in");
            }, 1);
            $(".s-toast-close", toastTpl).click(function () {
                if(CURRENT_TOAST == toastTpl){
                    removeToast(toastTpl);
                }
                toastTpl.remove();
                toastTpl.attr("_TOAST_STATUS_", "DELETED");
            });
            pushToast(toastTpl, holdTime);
        }
    });
})(jQuery);