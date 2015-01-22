/**
 * Created by Administrator on 2014/6/27.
 */
(function ($) {
    var mark_class = "s-btnGroup-active";
    var active_class_def_attr = Smart.optionAttrName('btnGroup', 'active-class');
    var actived_attr = Smart.optionAttrName('btnGroup', 'active');
    Smart.widgetExtend({
        id: "btnGroup",
        options: "active-class"
    }, {
        onPrepare: function () {
            var that = this;
            this.S.node.delegate(" > * ", "click", function(e){
                var btn = $(this);
                if(btn.hasClass(mark_class)) return;
                var lastBtn = btn.siblings("."+mark_class);
                lastBtn.size() && lastBtn.removeClass(that._getBtnActiveClass(lastBtn)).removeClass(mark_class);
                btn.addClass(mark_class).addClass(that._getBtnActiveClass(btn));
                e.stopPropagation();
            });
            this.cache.initActivedNode = $(" > *["+actived_attr+"] ", this.S.node).click();
        },
        _getBtnActiveClass: function(btn){
            return btn.attr(active_class_def_attr) || this.options['active-class'];
        },
        onReset: function () {
            this.cache.initActivedNode.click();
        }
    });
})(jQuery);
