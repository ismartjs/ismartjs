/**
 * Created by Administrator on 2014/6/21.
 */
//模板控件。
(function(){
    var token = 0;
    var TABLE_FN_KEY = "_TPL_FN_";
    var fn_map = {};
    Smart.widgetExtend("tpl", {
        onPrepare: function(){
            var tplText = this.S.node.html();
            this.S.node.empty();
            //处理脚本定义中的 lt,gt lt 处理成 <, gt处理成 >。
            //tplText = tplText.replace(/\slt\s/gi,"<").replace(/\sgt\s/gi, ">");
            var fn;
            if(tplText in fn_map){
                fn = fn_map[tplText]
            } else {
                var compiledText = $.template.compile(tplText);
                var scripts = [];
                scripts.push("(function(){");
                scripts.push("      return function(){");
                scripts.push(compiledText);
                scripts.push("      }");
                scripts.push("})();//@ sourceURL=" + (token++) + "_template.js");
                var script = scripts.join("\n");
                fn = this.S.context(script);
                fn_map[tplText] = fn;
            }
            this.cache[TABLE_FN_KEY] = fn;
            if(this.S.node.hasClass('s-ui-tpl-hide')){
                this.S.node.removeClass("s-ui-tpl-hide");
            }
        }
    },{
        dataSetter: function(data){
            this._insertData(data)
        },
        appendData: function(data){
            this._insertData(data, "appendNode");
        },
        prependData: function(data){
            this._insertData(data, "prependNode");
        },
        _insertData: function(data, mode){
            var fn = this.widget.tpl.cache[TABLE_FN_KEY];
            var html = fn.call(data);
            this[mode || "setNode"](html);
        }
    });
})();