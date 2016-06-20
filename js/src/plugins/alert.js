(function(){
    var DEFAULT_OPTION = {title : "提示", btnName: "确定"};
    Smart.extend(Smart.prototype, {
        alert: function(msg, level, option){
            if(level && $.type(level) !== 'string'){
                option = level;
                level = null;
            }
            var deferred = $.Deferred();
            var dialog = Smart.UI.template("alert");
            var levelSign = (level || 'info').split(":");
            level = levelSign[0];
            var sign = levelSign.length == 2 ? levelSign[1] : "s-alert-sign-default";
            var alertLevel = "s-alert-" + level;
            option = option || DEFAULT_OPTION;
            if($.type(option) == "string"){
                option = $.extend($.extend({}, DEFAULT_OPTION), {title: option});
            }
            dialog.addClass(alertLevel);
            $("*[s-alert-role='title']", dialog).html(option.title);
            $("*[s-alert-role='message']", dialog).html(msg);
            $("*[s-alert-role='sign']", dialog).addClass(sign);
            var btn = $("*[s-alert-role='btn']", dialog);
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