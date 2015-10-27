/**
 * Created by Administrator on 2014/9/2.
 */
(function ($) {
    Smart.widgetExtend({
        id: "datetimepicker",
        options: "format,config,autoclose,minView,maxView,maxView,language,pickTime,startView",
        defaultOptions: {
            format: "yyyy-mm-dd",
            autoclose: true,
            language: 'zh-CN',
            minView: 'month',
            todayHighlight: true
        }
    }, {
        onPrepare: function () {
            this.S.node.datetimepicker(this.options);
        }
    });
})(jQuery);
