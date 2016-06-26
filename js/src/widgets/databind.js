/**
 * Created by Administrator on 2014/6/21.
 */
(function(){
    //为子控件赋值控件。
    Smart.widgetExtend({
        id: "databind",
        defaultOptions: {
            targets: []
        }
    },null, {
        dataSetter: function(){
            var args = Smart.SLICE.call(arguments);
            var deferreds = [];
            var fnAttr = this.widget.databind.optionName("fn");
            function dataDo(){
                var that = this;
                deferreds.push(function(){
                    var fn = that.node.attr(fnAttr) || "data";
                    return that[fn].apply(that, args);
                })
            }
            $.each(this.widget.databind.targets, dataDo);
            return Smart.deferredQueue(deferreds);
        }
    });
})();