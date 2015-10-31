/**
 * Created by Administrator on 2014/6/27.
 */
(function ($) {
    var dropdown_val_attr = Smart.optionAttrName('dropdown', 'val');
    var dropdown_title_attr = Smart.optionAttrName('dropdown', 'title');
    var dropdown_title_selector = "*[" + Smart.optionAttrName('dropdown', 'role') + "='title']";
    Smart.widgetExtend({
        id: "dropdown",
        options: "action,ctx:t,ctx:reset-s"
    }, {
        onPrepare: function () {
            var that = this;
            if (that.options.action) {
                that.options.action = this.S.action(this.options.action)
            }
            this.cache.dropdownTitle = $(dropdown_title_selector, that.S.node);
            this.S.node.delegate("*[" + dropdown_val_attr + "]", 'click', function (e) {
                var val = $(this).attr(dropdown_val_attr);
                //如果配置了target，则把该值赋值给target
                if (that.options.t) {
                    that.options.t.val(val);
                }
                if (that.options.action) {//如果配置了e，则发送该事件
                    that.options.action.call(val);
                }
                var title = $(this).attr(dropdown_title_attr) || $(this).text();
                that.cache.dropdownTitle.html(title);
                if(that.options['reset-s']){
                    that.options['reset-s'].each(function(){
                        this.reset();
                    });
                }
            });
        },
        onReset: function () {
            this.cache.dropdownTitle.html("");
        }
    });
})(jQuery);
