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
            function dataDo(){
                var that = this;
                deferreds.push(function(){
                    var ig = that.node.attr(igAttr);
                    if(ig == "true" || ig == ""){
                        return;
                    }
                    return that.ready(function(){
                        var fn = that.node.attr(fnAttr) || "data";
                        return that[fn].apply(that, args);
                    })
                })
            }
            this.children().each(dataDo);
            this.widget.datac.options.targets && $.each(this.widget.datac.options.targets, dataDo);
            return Smart.deferredQueue(deferreds);
        }
    });
})();