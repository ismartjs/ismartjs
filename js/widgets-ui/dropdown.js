/**
 * Created by Administrator on 2014/6/27.
 */
(function($){
    var dropdown_val_attr = Smart.optionAttrName('dropdown', 'val');
    var dropdown_title_attr = Smart.optionAttrName('dropdown', 'title');
    var dropdown_title_selector = "*["+Smart.optionAttrName('dropdown','role')+"='title']";
    Smart.widgetExtend({
        id: "dropdown",
        options: "action,key,ctx:t"
    },{
        onPrepare: function(){
            var that = this;
             if(that.options.action){
                 that.options.action = this.S.action("var data = arguments[0]; \n" + this.options.action)
             }
            this.S.node.delegate("*["+dropdown_val_attr+"]", 'click', function(e){
                var val = $(this).attr(dropdown_val_attr);
                //如果配置了target，则把该值赋值给target
                if(that.options.t){
                    that.options.t.val(val);
                }
                if(that.options.action){//如果配置了e，则发送该事件
                    var data = {};
                    if(that.options['key'] == null){
                        data = val;
                    } else {
                        data[that.options['key']] = val;
                    }
                    that.options.action(data);
                }
                var title = $(this).attr(dropdown_title_attr) || $(this).text();
                $(dropdown_title_selector, that.S.node).html(title);
            });
        }
    });
})(jQuery);
