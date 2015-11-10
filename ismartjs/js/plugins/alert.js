(function(){
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
    var DEFAULT_LEVEL = ALERT_LEVEL.info;
    var DEFAULT_OPTION = {title : "提示", btnName: "确定"};
    Smart.extend(Smart.prototype, {
        alert: function(msg, level, option){
            var deferred = $.Deferred();
            var dialog = Smart.UI.template("alert");
            var alertLevel = ALERT_LEVEL[level] || DEFAULT_LEVEL;
            option = option || DEFAULT_OPTION;
            if($.type(option) == "string"){
                option = $.extend($.extend({}, DEFAULT_OPTION), {title: option});
            }
            $("*[s-ui-alert-role='title']", dialog).html(option.title);
            $("*[s-ui-alert-role='message']", dialog).html(msg);
            $("*[s-ui-alert-role='sign']", dialog).addClass(alertLevel.color).addClass(alertLevel.sign);
            var btn = $("*[s-ui-alert-role='btn']", dialog);
            btn.html(option.btnName);
            Smart.UI.backdrop();
            $(dialog).on("hide.bs.modal", function(){
                Smart.UI.backdrop(false).done(function(){
                    deferred.resolve();
                });
            }).on("hidden.bs.modal", function(){
                $(this).remove();
            }).on('shown.bs.modal', function(){
                btn.focus();
            }).css('zIndex', Smart.UI.zIndex()).modal({
                keyboard: false,
                backdrop: false
            });

            return deferred;
        }
    });
})();