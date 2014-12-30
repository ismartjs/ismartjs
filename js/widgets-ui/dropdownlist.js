/**
 * Created by Administrator on 2014/11/29.
 */
(function ($) {
    var dropdown_filter_selector = "*[" + Smart.optionAttrName('dropdownlist', 'role') + "='filter']";
    var dropdown_item_selector = "*[" + Smart.optionAttrName('dropdownlist', 'role') + "='item']";
    Smart.widgetExtend({
        id: "dropdownlist",
        options: "ctx:filter"
    }, {
        onPrepare: function () {
            var that = this;
            var filterNode = $(dropdown_filter_selector, this.S.node);
            var outerFilter = this.options.filter;
            filterNode.click(function(e){
                e.stopPropagation();
            });
            filterNode = filterNode.add(outerFilter);
            if(filterNode.size() > 0){
                filterNode.keyup(function(e){
                    $(dropdown_item_selector, that.S.node).hide();
                    $(dropdown_item_selector+":contains("+$(e.target).val()+")", that.S.node).show();
                    e.stopPropagation();
                });
                filterNode.focus(function(e){
                    e.stopPropagation();
                    $(e.target).select();
                });
            }
        },
        onReset: function () {
            $(dropdown_item_selector, this.S.node).show();
        }
    });
})(jQuery);