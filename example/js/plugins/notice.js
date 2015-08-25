(function ($) {

    var ALERT_LEVEL = {
        warning: {
            sign: "glyphicon glyphicon-exclamation-sign",
            color: "alert alert-warning"
        },
        info: {
            sign: "glyphicon glyphicon-info-sign",
            color: "alert alert-info"
        },
        success: {
            sign: "glyphicon glyphicon-ok-sign",
            color: "alert alert-success"
        },
        danger: {
            sign: "glyphicon glyphicon-remove-sign",
            color: "alert alert-danger"
        }
    };
    var DEFAULT_LEVEL = ALERT_LEVEL.warning;

    Smart.fn.extend({
        notice: function (msg, level) {
            var noticeTpl = Smart.UI.template("notice");
            var noticeLevel = ALERT_LEVEL[level] || DEFAULT_LEVEL;
            $("*[s-ui-notice-role='message']", noticeTpl).html(msg);
            noticeTpl.addClass(noticeLevel.color).css("top", "-1000px").appendTo("body");
            var height = noticeTpl.outerHeight();
            var width = noticeTpl.outerWidth();
            var windowWidth = $(window).width();
            var left = (windowWidth - width)/2;
            noticeTpl.css("top", -height+"px").css("left", left+"px").css("z-index", Smart.UI.zIndex());
            function removeNotice(){
                noticeTpl.css("top", -height+"px");
                noticeTpl.one($.support.transition.end, function(){
                    noticeTpl.remove();
                }).emulateTransitionEnd(200)
            }
            $(".close", noticeTpl).click(removeNotice);
            setTimeout(function(){
                noticeTpl.css("transition", "all .2s ease-out");
                noticeTpl.css("top", 0);
                setTimeout(removeNotice,2000);
            }, 10);
        }
    });
})(jQuery);