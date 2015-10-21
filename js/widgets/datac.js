/**
 * Created by Administrator on 2014/6/21.
 */
(function(){
    //为子控件赋值控件。
    Smart.widgetExtend({
        id: "datac"
    },null, {
        dataSetter: function(){
            var args = Smart.SLICE.call(arguments);
            var igAttr = this.widget.datac.optionName("ig");
            var fnAttr = this.widget.datac.optionName("fn");
            var deferreds = [];
            this.children().each(function(){
                var that = this;
                deferreds.push(function(){
                    var ig = that.node.attr(igAttr);
                    if(ig == "true" || ig == ""){
                        return;
                    }
                    var fn = that.node.attr(fnAttr) || "data";
                    return that[fn].apply(that, args);
                })
            });
            return Smart.deferredQueue(deferreds);
        }
    });
})();