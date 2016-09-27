/**
 * Created by Administrator on 2014/6/28.
 */
(function ($) {
    var SELECT_LIST_CLASS = ".s-select-list";
    var SELECT_LIST_ITEM_CLASS = ".s-select-list-item";
    var SELECT_MIRROR_CLASS = ".s-select-mirror";
    var SELECT_PANEL_CLASS = ".s-select-panel";

    function showSelectPanel(selectNode, selectPanel) {
        //selectPanel.show();
        selectNode.css("overflow", "visible");
    }

    function hideSelectPanel(selectNode, selectPanel) {
        //selectPanel.hide();
        selectNode.css("overflow", "hidden");
    }

    Smart.widgetExtend({
        id: "select",
        defaultOptions: {
            title: "name,title",
            value: "id"
        }
    }, {
        onPrepare: function () {
            this.cache = {};
            this.env = {};
            this.cache.optionMap = {};
            /**
             * 如果判断控件的node不是select元素，而且拥有s-select的class，则说明使用html来渲染下拉列表，而不是使用原生的下来列表
             * */
            if (!this.S.node.is("select") && this.S.node.hasClass("s-select")) {
                this.S.node.click(function (e) {
                    e.stopPropagation();
                });
                this.env.mode = "html";
                this.env.listContainer = $(SELECT_LIST_CLASS, this.S.node);
                this.env.targetNode = $(".s-select-input", this.S.node);
                var filterInput = $("input[type='text'].s-select-filter", this.S.node).attr('autocomplete', 'off');
                this.env.selectMirror = $(SELECT_MIRROR_CLASS, this.S.node);
                this.env.mirrorSpan = $("span", this.env.selectMirror);
                this.env.selectPanel = $(SELECT_PANEL_CLASS, this.S.node);
                if (this.env.listContainer.size() == 0) {
                    this.env.listContainer = $("<ul />").addClass(SELECT_LIST_CLASS.substring(1)).appendTo(this.env.selectPanel);
                }
                if (this.env.listContainer.is("ul")) {
                    this.env.listItemType = "li";
                } else {
                    this.env.listItemType = "div";
                }

                /**
                 * 绑定事件
                 * */
                var that = this;
                if (this.env.selectMirror.size() == 0) {
                    this.env.selectMirror = $("<div />").addClass(SELECT_MIRROR_CLASS.substring(1)).prependTo(this.S.node);
                }
                this.env.selectPanelShow = false;
                this.env.selectMirror.click(function () {
                    if (!that.env.selectPanelShow) {
                        $("body").click();
                        if (that.env.targetNode.prop("disabled") || that.env.targetNode.prop("readonly")) {
                            return;
                        }
                        showSelectPanel(that.S.node, that.env.selectPanel);
                        filterInput.focus();
                        $("body").one("click", function () {
                            hideSelectPanel(that.S.node, that.env.selectPanel);
                            that.env.selectPanelShow = false;
                        });
                        that.env.selectPanelShow = true;
                    } else {
                        hideSelectPanel(that.S.node, that.env.selectPanel);
                        that.env.selectPanelShow = false;
                    }
                });
                this.env.listContainer.delegate(SELECT_LIST_ITEM_CLASS, "click", function (e) {
                    e.stopPropagation();
                    var node = $(e.currentTarget);
                    that.env.targetNode.val(node.attr("value")).change();
                    that.env.mirrorSpan.html(node.html());
                    hideSelectPanel(that.S.node, that.env.selectPanel);
                    that.env.selectPanelShow = false;
                });
                if (filterInput.size() > 0) {
                    var that = this;
                    var filterTimeout;
                    filterInput.keyup(function (e) {
                        if (filterTimeout) {
                            window.clearTimeout(filterTimeout);
                        }
                        var val = this.value;
                        filterTimeout = setTimeout(function () {
                            filterTimeout = 0;
                            if (val == "") {
                                that.env.listContainer.children(":hidden").show();
                                return;
                            }
                            that.env.listContainer.children(":contains('" + val + "'):hidden").show();
                            that.env.listContainer.children("*:not(:contains('" + val + "'))").hide();
                        }, 300);
                        e.stopPropagation();
                    });
                }
                this.cache.originalOptions = this.env.listContainer.children();
                this.S.data(this.env.listContainer.children(":eq(0)").attr("value"));
            } else {
                this.env.listContainer = this.S.node;
                var originalOptions = this.S.node.children();
                this.cache.originalOptions = originalOptions;
            }
        },
        onClean: function () {
            //this.env.targetNode.val("");
            //this.env.selectMirror
        }
    }, {
        buildSetter: function (datas) {
            datas = datas || [];
            if (!$.isArray(datas)) {
                var _datas = datas;
                datas = [];
                $.each(_datas, function (key, value) {
                    datas.push({title: value, id: key})
                });
            }
            this.widget.select.cache.optionMap = {};
            this.widget.select.cache.dataMap = {};
            for (var i in datas) {
                var _data = this._getOptionData(datas[i]);
                this.widget.select.cache.optionMap[_data.value] = _data;
                this.widget.select.cache.dataMap[_data.value] = datas[i];
            }
            this.widget.select.cache.buildData = datas;
            this.widget.select.env.listContainer.empty();
            this.widget.select.env.listContainer.append(this.widget.select.cache.originalOptions);
            if (this.widget.select.env.mode == "html") {
                var that = this;
                this.node.one("click", function () {
                    that._createOptions();
                })
            } else {
                this._createOptions();
            }
        },
        _createOptions: function () {
            var datas = this.widget.select.cache.buildData;
            for (var i in datas) {
                this.widget.select.env.listContainer.append(this._createOption(datas[i]));
            }
        },
        _getOptionData: function (data) {
            if ($.type(data) == 'string') {
                data = {
                    name: data,
                    id: data
                };
            }
            var value, title;
            if ($.isFunction(this.widget.select.options.value)) {
                value = this.widget.select.options.value(data);
            } else {
                value = data[this.widget.select.options.value];
            }
            if ($.isFunction(this.widget.select.options.title)) {
                title = this.widget.select.options.title(data);
            } else {
                var tmp = this.widget.select.options.title.split(",");
                title = tmp[0] in data ? data[tmp[0]] : data[tmp[1]];
            }
            return {value: value, title: title};
        },
        _createOption: function (data) {

            var optionData = this._getOptionData(data);

            var option;
            if (this.widget.select.env.mode == "html") {
                option = $('<' + this.widget.select.env.listItemType + ' value="' + optionData.value + '">' + optionData.title + '</' + this.widget.select.env.listItemType + '>');
                option.addClass(SELECT_LIST_ITEM_CLASS.substring(1));
            } else {
                option = $('<option value="' + optionData.value + '">' + optionData.title + '</option>');
            }
            return option;
        },
        getSelectData: function () {
            var val = this.node.val();
            return this.widget.select.cache.dataMap[val];
        },
        dataSetter: function (value) {
            if (this.widget.select.env.mode == "html") {
                var optionData = this.widget.select.cache.optionMap[value];
                if (!optionData) {
                    var firstNode = this.widget.select.env.listContainer.children(":eq(0)");
                    if (firstNode.size() > 0) {
                        optionData = {
                            value: firstNode.attr("value"),
                            title: firstNode.html()
                        }
                    } else if (this.widget.select.cache.buildData) {
                        optionData = this._getOptionData(this.widget.select.cache.buildData[0]);
                    } else {
                        optionData = {
                            value: "",
                            title: "请选择"
                        }
                    }
                }
                //var optionNode = $("*[value='" + data + "']", this.widget.select.env.listContainer);
                //if (optionNode.size() == 0) {
                //    optionNode = this.widget.select.env.listContainer.children(":eq(0)");
                //    data = optionNode.attr("value");
                //}
                this.widget.select.env.targetNode.val(optionData.value);
                this.widget.select.env.mirrorSpan.html(optionData.title);
                return;
            }
            return this.inherited([value]);
        },
        val: function () {
            if (this.widget.select.env.mode == "html") {
                return this.widget.select.env.targetNode.val();
            } else {
                return this.node.val();
            }
        }
    });
})(jQuery);