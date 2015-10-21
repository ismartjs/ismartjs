/**
 * Created by nana on 2015/8/31.
 */
(function($){

    Smart.extend({
        "checkDataSubmit": function(options){
            options = $.extend({
                "confirmMsg": "确认进行此操作吗？",
                "errorMsg": "请选择你要操作的数据？",
                confirm: true,
                dataKey: 'ids',
                dataFilter: "id",
                method: 'post',
                url: null,
                smart: null,
                done: Smart.noop,
                fail: Smart.noop
            }, options || {});

            var smart = options.smart;
            var deferred = $.Deferred();
            if(!smart){
                alert("请配置Smart");
                return deferred.reject();
            }
            if(Smart.isEmpty(options.url)){
                alert("请配置url");
                return deferred.reject();
            }
            var checkedData;
            if($.isFunction(options.dataFilter)){
                checkedData = filter(smart.getChecked());
            } else {
                checkedData = smart.getCheckedData(options.dataFilter);
            }
            if (Smart.isEmpty(checkedData)) {
                smart.notice(options.errorMsg, "warning");
                return deferred.reject();
            }
            function doSubmit(){
                var data = {};
                data[options.dataKey] = checkedData;
                return smart[options.method](options.url, data).done(function(){
                    options.done.apply(smart, $.makeArray(arguments));
                }).fail(function(){
                    options.fail.apply(smart, $.makeArray(arguments));
                });
            }
            if(options.confirm){
                smart.confirm(options.confirmMsg, {sign: "warning"}).done(function(){
                    Smart.deferredChain(deferred, doSubmit());
                });
                return deferred;
            } else {
                return doSubmit();
            }
        }
    })

})(jQuery);