/**
 * Created by Administrator on 2014/6/26.
 */
(function($){

    var roleAttr = Smart.optionAttrName("loop", "role");

    function getRoleNode(val, node){
        return $("*["+roleAttr+"='"+val+"']:first", node);
    }

    //loop控件，可以用该控件来构建列表，grid。
    Smart.widgetExtend({
        id: "loop",
        options: "type,childrenKey,indentWidth,indentPre",
        defaultOptions: {
            'childrenKey': "children",
            indent: 20
        }
    }, {
        onPrepare: function(){
            this.cache = {};
            var emptyRow = getRoleNode("empty", this.S.node);
            var loopRow = getRoleNode("row", this.S.node);
            var prepareRow = getRoleNode("prepare", this.S.node);
            this.S.node.empty();
            prepareRow.size() && this.S.node.append(prepareRow);
            this.cache.emptyRow = emptyRow;
            this.cache.loopRow = loopRow;
        }
    },{
        empty: function(){
            this.node.empty();
        },
        addRow: function(data, indentNum, mode){
            var row = this._getRow().show();
            if(indentNum){
                var indentNode = row.find('*[s-loop-tree-role="indent"]');
                if(this.widget.loop.options['indentPre']){
                    var str = this.widget.loop.options['indentPre'];
                    for(var i = 1; i < indentNum; i++){
                        str += str;
                    }
                    indentNode.prepend(str);
                } else if(indentNode.size() >= 0){
                    indentNode.css("text-indent", this.widget.loop.options.indent * indentNum + "px");
                }

            }
            var that = this;
            var rowSmart = Smart.of(row);
            rowSmart.render().done(function(){
                rowSmart.data(data);
                that.node.append(rowSmart.node);
                that.trigger("row-add", [row, data, indentNum, mode]);
            });
        },
        addRows: function(datas, indentNum, mode){
            indentNum = indentNum == undefined ? 0 : indentNum;
            for(var i = 0; i < datas.length; i++){
                this.addRow(datas[i], indentNum, mode);
                //如果是tree的方式
                if(this.widget.loop.options.type == "tree"){
                    var children = datas[i][this.widget.loop.options['childrenKey']];
                    if(children && children.length){
                        this.addRows(children, indentNum + 1, mode);
                    }
                }
            }
        },
        _getRow: function(){
            var row = this.widget.loop.cache.loopRow.clone();
            return row;
        },
        _addEmptyRow: function(){
            var emptyRow = this.widget.loop.cache.emptyRow;
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
            var that = this;
            setTimeout(function(){
                that.addRows(datas);
            }, 0);
        },
        dataSetter: function(data){
            if(!$.isArray(data)){
                Smart.error("loop控件接受的赋值参数必须是数组");
                return;
            }
            this.setRows(data);
        }
    });
    Smart.widgetExtend({
        id: "row",
        options: "ctx:render"
    }, null, {
        dataSetter: function(data){
            this.widget.row.cache_data = data;
            this.inherited([data]);
            this.widget.row.options.render && this.widget.row.options.render.call(this, this.node);
        },
        dataGetter: function(){
            return this.widget.row.cache_data;
        }
    });
})(jQuery);