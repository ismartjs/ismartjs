/**
 * Created by Administrator on 2014/7/3.
 */
(function(){
    var checkPathAttr = Smart.optionAttrName("check",'path');
    Smart.widgetExtend({
        id: "loopCheckCombine"
    },{
        onPrepare: function(){

            this.S.on("row-add", function(e, row, data, indentNum){
                var path = [""];
                for(var i = 0; i <= indentNum; i++){
                    path.push(i);
                }
                row.attr(checkPathAttr, path.join("/"));
            });
        }
    });
})();