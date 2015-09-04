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
    var DEFAULT_LEVEL = ALERT_LEVEL.info;

    var aTime = 200;

    var HOLDTIME = 3000;

    Smart.fn.extend({
        notice: function (msg, level, holdTime) {
            holdTime = holdTime || HOLDTIME;
            var noticeTpl = Smart.UI.template("notice");
            var noticeLevel = ALERT_LEVEL[level] || DEFAULT_LEVEL;
            $("*[s-ui-notice-role='message']", noticeTpl).html(msg);
            $(".s-ui-notice-sign", noticeTpl).addClass(noticeLevel.sign);
            noticeTpl.addClass(noticeLevel.color)
                .css({
                    "z-index": Smart.UI.zIndex(),
                    "transition": "all " + (aTime / 1000) + "s cubic-bezier(0.51, 0.12, 1, 1)"
                }).appendTo("body");
            setTimeout(function () {
                noticeTpl.addClass("notice-show");
                setTimeout(function(){
                    noticeTpl.css({"animation": "s-ui-notice-bounce 0.15s cubic-bezier(0.51, 0.18, 1, 1)"});
                }, aTime);
            }, 10);

            var removeTimeout = 0;

            function removeNoticeNode() {
                return setTimeout(function () {
                    noticeTpl.remove();
                }, 2000);
            }

            function removeNotice() {
                noticeTpl.css({
                    opacity: 0,
                    "transition": "all 2s cubic-bezier(0.51, 0.12, 1, 1)"
                });
                removeTimeout = removeNoticeNode();
            }

            $(".close", noticeTpl).click(function(){
                noticeTpl.remove();
            });
            var closeTimeout = setTimeout(removeNotice, holdTime);
            noticeTpl.mouseover(function () {
                noticeTpl.css({
                    opacity: 1,
                    "transition": "all .2s ease-out"
                });
                window.clearTimeout(closeTimeout);
                window.clearTimeout(removeTimeout);
            }).mouseleave(function () {
                closeTimeout = setTimeout(removeNotice, holdTime);
            });
        }
    });
})(jQuery);