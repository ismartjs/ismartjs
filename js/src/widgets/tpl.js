/**
 * Created by Administrator on 2014/6/21.
 */
//模板控件。
(function () {
    var token = 0;
    var TABLE_FN_KEY = "_TPL_FN_";
    Smart.widgetExtend({
        id: "tpl",
        options: "tplText"
    }, {
        onPrepare: function () {
            this.cache = {};
            var tplText;
            if (this.options.tplText) {
                tplText = this.options.tplText;
            } else {
                var plainTextNode = this.S.node.find(" > script[type='text/template']");
                if (plainTextNode.size() > 0) {
                    tplText = plainTextNode.html();
                } else {
                    tplText = this.S.node.html();
                }
            }
            this.S.node.empty();
            var fn;
            var fn_map = this.S.contextValue("s-tpl-fn_map");
            if (!fn_map) {
                fn_map = {};
                this.S.contextValue("s-tpl-fn_map", fn_map);
            }
            if (tplText in fn_map) {
                fn = fn_map[tplText]
            } else {
                var compiledText = $.template.compile(tplText);
                var scripts = [];
                scripts.push("(function(){");
                scripts.push("      return function(){");
                scripts.push(compiledText);
                scripts.push("      }");
                scripts.push("})();//# sourceURL=" + (token++) + "_template.js");
                var script = scripts.join("\n");
                fn = this.S.context(script);
                fn_map[tplText] = fn;
            }
            this.cache[TABLE_FN_KEY] = fn;
            if (this.S.node.hasClass('s-tpl-text')) {
                this.S.node.removeClass("s-tpl-text");
            }
        }
    }, {
        dataSetter: function (data) {
            this._insertData(data)
        },
        appendData: function (data) {
            this._insertData(data, "appendNode");
        },
        prependData: function (data) {
            this._insertData(data, "prependNode");
        },
        _insertData: function (data, mode) {
            var fn = this.widget.tpl.cache[TABLE_FN_KEY];
            var html = fn.call(data);
            this[mode || "setNode"](html);
            this.node.addClass("s-tpl-shown");
        }
    });
})();