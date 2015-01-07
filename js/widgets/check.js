/**
 * Created by Administrator on 2014/6/27.
 */
(function ($) {

    var CHECK_ITEM_SELECTOR = "*[" + Smart.optionAttrName('check', 'role') + "='i']";
    var CHECK_ITEM_HANDLER_SELECTOR = "*[" + Smart.optionAttrName('check', 'role') + "='h']";
    var CHECK_PATH_ATTR = Smart.optionAttrName('check', 'path');
    var CHECKED_ATTR = "s_check_checked";
    var CHECKED_CLASS = "s-ui-check-checked";
    var CHECK_ROW_IG_SELECTOR = "*[" + Smart.optionAttrName('check', 'ig') + "]";
    //选中控件
    Smart.widgetExtend({
        id: "check",
        options: "i-checked-class, turn, multiple, ctx:checkall-h, h-checked-class, path",
        defaultOptions: {
            "turn": "on",
            "i-checked-class": "warning",
            multiple: true,
            "h-checked-class": "",
            "path": "false"
        }
    }, {
        onPrepare: function () {
            var that = this;
            this.S.node.delegate(CHECK_ITEM_SELECTOR, "click", function (e) {
                if (that.options.turn != "on") {
                    return;
                }
                that.S._toggleCheck($(this), e);
            });

            var checkallHandles = [];
            this.cache.checkallHandles = checkallHandles;
            var innerCheckallHandle = $("*[s-check-role='checkall-h']", this.S.node);

            if (innerCheckallHandle.size() > 0) {
                checkallHandles.push(innerCheckallHandle);
                this.S.node.delegate("*[s-check-role='checkall-h']", "click", function (e) {
                    that.S._toggleCheckAll($(this));
                    e.stopPropagation();
                });
            }
            if (this.options['checkall-h']) {
                checkallHandles.push(this.options['checkall-h']);
                this.options['checkall-h'].click(function (e) {
                    that.S._toggleCheckAll($(this));
                    e.stopPropagation();
                });
            }

            this.S.node.delegate(CHECK_ITEM_SELECTOR, "unchecked", function (e) {
                innerCheckallHandle.size() && that.S._uncheckHandle(innerCheckallHandle);
                that.options['checkall-h'] && that.S._uncheckHandle(that.options['checkall-h']);
                that.options['checkall-h'] && that.options['checkall-h'].prop("checked", false);
                e.stopPropagation();
            });
        },
        onRefresh: function () {
            this.S.uncheckAll()
        },
        onReset: function () {
            this.S.uncheckAll()
        }
    }, {
        turn: function (type) {
            this.widget.check.options.turn = type;
            if (type != "on") {
                $(CHECK_ITEM_HANDLER_SELECTOR, this.node).prop("disabled", true);
            } else {
                $(CHECK_ITEM_HANDLER_SELECTOR, this.node).prop("disabled", false);
            }
        },
        _toggleCheckAll: function (node) {
            var flag;
            if (node.hasClass(CHECKED_CLASS)) {
                flag = false;
                node.removeClass(this.widget.check.options['h-checked-class']).removeClass(CHECKED_CLASS);
            } else {
                flag = true;
                node.addClass(this.widget.check.options['h-checked-class']).addClass(CHECKED_CLASS);
            }
            flag ? this.checkAll() : this.uncheckAll();
        },
        checkAll: function () {
            this._checkHandlesByFlag(true);
            var that = this;
            $(CHECK_ITEM_SELECTOR, this.node).each(function () {
                that._checkNode($(this));
            });
        },
        uncheckAll: function () {
            this._checkHandlesByFlag(false);
            var that = this;
            $(CHECK_ITEM_SELECTOR, this.node).each(function () {
                that._uncheckNode($(this));
            });
        },
        _checkHandlesByFlag: function (flag) {
            var checkallHandles = this.widget.check.cache.checkallHandles;
            var that = this;
            $.each(checkallHandles, function () {
                flag ? that._checkHandle($(this)) : that._uncheckHandle($(this));
            });
        },
        _checkHandle: function (node) {
            node.addClass(this.widget.check.options['h-checked-class']);
            if (node.is(":checkbox")) {
                node.prop("checked", true);
            }
        },
        _uncheckHandle: function (node) {
            node.removeClass(this.widget.check.options['h-checked-class']);
            if (node.is(":checkbox")) {
                node.prop("checked", false);
            }
        },
        getChecked: function (type) {
            var smarts = [];
            $.each($(CHECK_ITEM_SELECTOR + "[" + CHECKED_ATTR + "]", this.node), function () {
                smarts.push(type == "node" ? $(this) : Smart.of($(this)));
            });
            return smarts;
        },
        getCheckedData: function (field) {
            var datas = [];
            var that = this;
            $.each(this.getChecked(), function () {
                if (field) {
                    datas.push(that.data()[field]);
                } else {
                    datas.push(that.data());
                }
            });
            return datas;
        },
        _toggleCheck: function (node, e) {
            //如果选择项下面拥有选择句柄，而且选择事件不是选择句柄发出的，则跳过。
            if (e && $(CHECK_ITEM_HANDLER_SELECTOR, node).size() > 0) {
                if (!$(e.target).is(CHECK_ITEM_HANDLER_SELECTOR)) {
                    return;
                }
            }
            var checkedClass = this.widget.check.options['i-checked-class'];
            if (node.hasClass(checkedClass)) {
                this._uncheck(node);
            } else {
                this._check(node);
            }
        },
        _check: function (node) {
            if (node.hasClass(this.widget.check.options['i-checked-class'])) {
                return;
            }
            //如果是单选，则需要把其他的item取消选中
            var that = this;
            if (this.widget.check.options.multiple == false) {
                $(CHECK_ITEM_SELECTOR, this.node).not(node).each(function () {
                    that._uncheck($(this));
                });
            }

            this._checkNode(node);
            if (this.widget.check.options['path'] == 'true') this._checkNextUntil(node);
        },
        _checkNextUntil: function (node) {
            var i = node.attr(CHECK_PATH_ATTR);
            //将下级的所有节点选中
            var nextNodes = node.nextUntil(":not(*[" + CHECK_PATH_ATTR + "^=" + i + "/])");
            var that = this;
            nextNodes.each(function () {
                that._checkNode($(this));
            });
        },
        _uncheck: function (node) {
            if (!node.hasClass(this.widget.check.options['i-checked-class'])) {
                return;
            }
            this._uncheckNode(node);
            if (this.widget.check.options['path'] == 'true') {
                //取消选中下级的所有节点
                this._uncheckPrevUntil(node);
                //取消选中所有的上级节点
                this._uncheckNextUntil(node);
            }
        },
        _uncheckNextUntil: function (node) {
            var i = node.attr(CHECK_PATH_ATTR);
            //将下级的所有节点取消选中
            var nextNodes = node.nextUntil(":not(*[" + CHECK_PATH_ATTR + "^=" + i + "/])");
            var that = this;
            nextNodes.each(function () {
                that._uncheckNode($(this));
            });
        },
        _uncheckPrevUntil: function (node) {
            var path = node.attr(CHECK_PATH_ATTR);
            if (path == undefined) {
                return;
            }
            var segs = path.split("/");
            var currentNode = node;
            while (segs.length > 2) {
                segs.pop();
                var p = segs.join("/");
                var attr = "*[" + CHECK_PATH_ATTR + "=" + p + "]";
                var prevNode = currentNode.prevUntil(attr).last().prev();
                if (prevNode.size() == 0) {
                    prevNode = currentNode.prev();
                }
                if (prevNode.is(attr)) {
                    currentNode = prevNode;
                    this._uncheckNode(prevNode);
                }
            }
        },
        _checkNode: function (node) {
            if (node.attr(CHECKED_ATTR) || $(CHECK_ROW_IG_SELECTOR, node).size() > 0 || node.attr(CHECK_ROW_IG_SELECTOR)) {
                return;
            }
            node.attr(CHECKED_ATTR, true).addClass(this.widget.check.options['i-checked-class']).addClass(CHECKED_CLASS).trigger("checked");

            var handler = $(CHECK_ITEM_HANDLER_SELECTOR, node);
            if (handler.size() == 0) return;
            handler.addClass(this.widget.check.options['h-checked-class']).addClass(CHECKED_CLASS);
            if (handler.is(":checkbox")) {
                setTimeout(function () {
                    if (!handler.prop("checked")) handler.prop("checked", true);
                }, 1);
            }
        },
        _uncheckNode: function (node) {
            if (!node.attr(CHECKED_ATTR)) {
                return;
            }
            node.removeAttr(CHECKED_ATTR).removeClass(this.widget.check.options['i-checked-class']).removeClass(CHECKED_CLASS).trigger("unchecked");
            var handler = $(CHECK_ITEM_HANDLER_SELECTOR, node);
            if (handler.size() == 0) return;
            handler.removeClass(this.widget.check.options['h-checked-class']).removeClass(CHECKED_CLASS);
            if (handler.is(":checkbox")) {
                setTimeout(function () {
                    if (handler.prop("checked")) handler.prop("checked", false);
                }, 1);
            }
        }
    });
})(jQuery);