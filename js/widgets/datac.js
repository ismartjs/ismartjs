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
            this.children().each(function(){
                var ig = this.node.attr(igAttr);
                if(ig == "true" || ig == ""){
                    return;
                }
                var fn = this.node.attr(fnAttr) || "data";
                this[fn].apply(this, args);
            });
        }
    });
})();