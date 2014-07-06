/**
 * Created by Administrator on 2014/7/3.
 */
(function(){
    var checkPathAttr = Smart.optionAttrName("check",'path');
    Smart.widgetExtend({
        id: "loopCheckCombine"
    },{
        onPrepare: function(){

            this.on("row-add", function(e, row, data, indentNum){
                var path = [""];
                for(var i = 0; i <= indentNum; i++){
                    path.push(i);
                }
                row.attr(checkPathAttr, path.join("/"));
            });

            //设置check控件的 check-path 配置为true
            this.trigger("option", ["check", 'check-path', 'true']);
        }
    });
})();