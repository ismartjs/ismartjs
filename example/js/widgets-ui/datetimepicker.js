/**
 * Created by Administrator on 2014/9/2.
 */
(function ($) {
    Smart.widgetExtend({
        id: "datetimepicker",
        options: "format,config,autoclose,minView,maxView,language,pickTime",
        defaultOptions: {
            format: "yyyy-mm-dd",
            autoclose: true,
            language: 'zh-CN',
            showMeridian: 'day',
            minView: 'month',
            todayHighlight: true
        }
    }, {
        onPrepare: function () {
            var config = this.options.config || {};
            var that = this;
            $.each(['format','autoclose','todayHighlight','minView','language'], function(i, v){
               if(config[v] == undefined){
                   config[v] = that.options[v];
               }
            });
            this.S.node.datetimepicker(config);
        }
    });
})(jQuery);
