/**
 * Created by Administrator on 2014/6/26.
 */
(function($){

    var roleAttr = Smart.optionAttrName("loop", "role");

    function getRoleNode(val, node){
        return $("*["+roleAttr+"='"+val+"']", node);
    }

    //loop控件，可以用该控件来构建列表，grid。
    Smart.widgetExtend({
        id: "loop",
        options: "type,tree-c,tree-indent-width,tree-indent-str",
        defaultOptions: {
            'tree-c': "children",
            indent: 20
        }
    }, {
        onPrepare: function(){
            var emptyRow = getRoleNode("empty", this.node);
            var loopRow = getRoleNode("row", this.node);
            this.node.empty();
            this.dataTable("loop", "emptyRow", emptyRow);
            this.dataTable("loop", "loopRow", loopRow);
        }
    },{
        empty: function(){
            this.node.empty();
        },
        addRow: function(data, indentNum, mode){
            var row = this._getRow();
            if(indentNum){
                var indentNode = row.find('*[s-loop-tree-role="indent"]');
                if(this.options.loop['tree-indent-str']){
                    var str = this.options.loop['tree-indent-str'];
                    for(var i = 1; i < indentNum; i++){
                        str += str;
                    }
                    indentNode.prepend(str);
                } else if(indentNode.size() >= 0){
                    indentNode.css("text-indent", this.options.loop.indent * indentNum + "px");
                }

            }
            var rowSmart = Smart.of(row);
            rowSmart.on("made", function(){
                rowSmart.data(data);
            });
            this[(mode || "append")+"Node"](row);
            this.trigger("row-add", [row, data, indentNum, mode]);
        },
        addRows: function(datas, indentNum, mode){
            indentNum = indentNum == undefined ? 0 : indentNum;
            for(var i = 0; i < datas.length; i++){
                this.addRow(datas[i], indentNum, mode);
                //如果是tree的方式
                if(this.options.loop.type == "tree"){
                    var children = datas[i][this.options.loop['tree-c']];
                    if(children && children.length){
                        this.addRows(children, indentNum + 1, mode);
                    }
                }
            }
        },
        _getRow: function(){
            var row = this.dataTable("loop", "loopRow").clone();
            return row;
        },
        _addEmptyRow: function(){
            var emptyRow = this.dataTable("loop", "emptyRow");
            if(emptyRow){
                this.node.append(emptyRow.clone());
            }
        },
        setRows: function(datas){
            this.empty();
            if(datas.length == 0){
                this._addEmptyRow();
                return;
            }
            this.addRows(datas);
        },
        dataSetter: function(data){
            if(!$.isArray(data)){
                Smart.error("loop控件接受的赋值参数必须是数组");
            }
            this.setRows(data);
        }
    });
    Smart.widgetExtend({
        id: "row",
        options: "ctx:render"
    }, null, {
        dataSetter: function(data){
            this.dataTable("row", "data", data);
            this.inherited([data]);
            this.options.row.render && this.options.row.render.call(this, this.node);
        },
        dataGetter: function(){
            return this.dataTable("row", "data");
        }
    });
})(jQuery);