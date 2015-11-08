/**
 * Created by Administrator on 2014/6/26.
 */
(function ($) {

    var roleAttr = Smart.optionAttrName("loop", "role");

    function getRoleNode(val, node) {
        return $("*[" + roleAttr + "='" + val + "']:first", node);
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
        onPrepare: function () {
            this.cache = {};
            var emptyRow = getRoleNode("empty", this.S.node);
            var loadingRow = getRoleNode("loading", this.S.node);
            var loopRow = getRoleNode("row", this.S.node);
            var prepareRow = getRoleNode("prepare", this.S.node);
            this.S.node.empty();
            prepareRow.size() && this.S.node.append(prepareRow);
            emptyRow.size() && (this.cache.emptyRow = emptyRow);
            prepareRow.size() && (this.cache.prepareRow = prepareRow);
            loopRow.size() && (this.cache.loopRow = loopRow);
            loadingRow.size() && (this.cache.loadingRow = loadingRow);
        },
        onData: function () {
            if (this.cache.loadingRow) {
                this.S.empty();
                this.S.node.append(this.cache.loadingRow);
            }
        }
    }, {
        empty: function () {
            this.node.empty();
        },
        hideAssistRows: function () {
            this.widget.loop.cache.prepareRow && this.widget.loop.cache.prepareRow.is(':visible') && this.widget.loop.cache.prepareRow.remove();
            this.widget.loop.cache.emptyRow && this.widget.loop.cache.emptyRow.is(':visible') && this.widget.loop.cache.emptyRow.remove();
            this.widget.loop.cache.loadingRow && this.widget.loop.cache.loadingRow.is(':visible') && this.widget.loop.cache.loadingRow.remove();
        },
        addRow: function (data, mode, indentNum, igCheckAssistRow) {
            var row = this._getRow().show();
            if (igCheckAssistRow) {
                this.hideAssistRows();
            }
            if (indentNum) {
                var indentNode = row.find('*[s-loop-tree-role="indent"]');
                if (this.widget.loop.options['indentPre']) {
                    var str = this.widget.loop.options['indentPre'];
                    for (var i = 1; i < indentNum; i++) {
                        str += str;
                    }
                    indentNode.prepend(str);
                } else if (indentNode.size() >= 0) {
                    indentNode.css("text-indent", this.widget.loop.options.indent * indentNum + "px");
                }

            }
            var that = this;
            var rowSmart = Smart.of(row);
            this.node[mode || 'append'](rowSmart.node);
            rowSmart.render().done(function () {
                rowSmart.data(data);
                that.trigger("row-add", [row, data, mode, indentNum]);
            });
        },
        addRows: function (datas, mode, indentNum) {
            this.hideAssistRows();
            indentNum = indentNum == undefined ? 0 : indentNum;
            for (var i = 0; i < datas.length; i++) {
                this.addRow(datas[i], mode, indentNum, true);
                //如果是tree的方式
                if (this.widget.loop.options.type == "tree") {
                    var children = datas[i][this.widget.loop.options['childrenKey']];
                    if (children && children.length) {
                        this.addRows(children, mode, indentNum + 1);
                    }
                }
            }
        },
        _getRow: function () {
            var row = this.widget.loop.cache.loopRow.clone();
            return row;
        },
        _addEmptyRow: function () {
            var emptyRow = this.widget.loop.cache.emptyRow;
            if (emptyRow) {
                this.node.append(emptyRow.show());
            }
        },
        setRows: function (datas) {
            this.empty();
            if (datas.length == 0) {
                this._addEmptyRow();
                return;
            }
            var that = this;
            var deferred = $.Deferred();
            setTimeout(function () {
                that.addRows(datas);
                deferred.resolve();
            }, 10);
            return deferred;
        },
        dataSetter: function (data) {
            if (data == null) {
                data = [];
            }
            if (!$.isArray(data)) {
                Smart.error("loop控件接受的赋值参数必须是数组");
                return;
            }
            return this.setRows(data);
        }
    });
    Smart.widgetExtend({
        id: "row",
        options: "ctx:render"
    }, null, {
        dataSetter: function (data) {
            this.widget.row.cache_data = data;
            this.inherited([data]);
            this.widget.row.options.render && this.widget.row.options.render.call(this, this.node);
        },
        dataGetter: function () {
            return this.widget.row.cache_data;
        }
    });
})(jQuery);