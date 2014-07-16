/**
 * Created by Administrator on 2014/6/27.
 */
(function ($) {

    var paging = function (page, pageSize, totalCount, showSize) {
        showSize = showSize || 10;
        page = page < 1 ? 1 : page;
        var totalPage = Math.ceil(totalCount / pageSize);
        var startPage = page - Math.floor(showSize / 2);
        if (startPage < 1)
            startPage = 1;
        var endPage = startPage + showSize;
        if (endPage > totalPage) {
            endPage = totalPage;
            startPage = endPage - showSize;
            if (startPage < 1)
                startPage = 1;
        }
        var startPrePage = 0;
        if (startPage > 1)
            startPrePage = startPage - 1;
        var endNextPage = 0;
        if (endPage < totalPage)
            endNextPage = endPage + 1;
        var prePage = 0, nextPage = 0;
        if(page > 1) prePage = page - 1;
        if(page < totalPage) nextPage = page + 1;
        var startNum = (page - 1) * pageSize + 1;
        var endNum = startNum + pageSize - 1;
        if (endNum > totalCount)
            endNum = totalCount;
        return {
            page: page,
            pageSize: pageSize,
            totalCount: totalCount,
            startPage: startPage,
            endPage: endPage,
            startNum: startNum,
            endNum: endNum,
            startPrePage: startPrePage,
            endNextPage: endNextPage,
            prePage: prePage,
            nextPage: nextPage,
            totalPage: totalPage
        };
    };

    //分页控件
    Smart.widgetExtend({
        id: "pagination",
        options: "pagekey, pskey, totalkey, showsize, start-p, end-n, disabled-c, active-c, pre, next, event",
        defaultOptions: {
            'pagekey': "page",
            'pskey': "pageSize",
            'totalkey': "total",
            "showsize": 11,
            "start-p": "&laquo;",
            "end-n": "&raquo;",
            "pre": "‹",
            "next": "›",
            "disabled-c": "disabled",
            "active-c": "active",
            "event": "request.params",//页点击所触发的事件
            "ed-pk": "page"//event.data的page key
        }
    }, {
        onPrepare: function () {

        }
    }, {
        dataSetter: function (data) {
            var pi = paging(data[this.widget.pagination.options['pagekey']],
                data[this.widget.pagination.options['pskey']],
                data[this.widget.pagination.options['totalkey']],
                data[this.widget.pagination.options['showsize']]);
            this.node.empty();
            var startPreLi = this._createLi(this.widget.pagination.options['start-p']);
            if (pi.startPrePage <= 0) {
                startPreLi.addClass(this.widget.pagination.options['disabled-c']);
            } else {
                startPreLi.click(function () {
                    that._triggerPage(pi.startPrePage);
                });
            }
            this.node.append(startPreLi);
            var preLi = this._createLi(this.widget.pagination.options.pre);
            if (pi.prePage <= 0) {
                preLi.addClass(this.widget.pagination.options['disabled-c']);
            } else {
                preLi.click(function () {
                    that._triggerPage(pi.prePage);
                });
            }
            this.node.append(preLi);
            var that = this;
            for (var i = pi.startPage; i <= pi.endPage; i++) {
                (function (i) {
                    var pageLi = that._createLi(i);
                    if (i == pi.page) {
                        pageLi.addClass(that.widget.pagination.options['active-c']);
                    } else {
                        pageLi.click(function () {
                            that._triggerPage(i);
                        });
                    }
                    that.node.append(pageLi);
                })(i);
            }
            var nextLi = this._createLi(this.widget.pagination.options.next);
            if (pi.nextPage <= 0) {
                nextLi.addClass(this.widget.pagination.options['disabled-c']);
            } else {
                nextLi.click(function () {
                    that._triggerPage(pi.nextPage);
                });
            }
            this.node.append(nextLi);
            var endNextLi = this._createLi(this.widget.pagination.options['end-n']);
            if (pi.endNextPage <= pi.endPage) {
                endNextLi.addClass(this.widget.pagination.options['disabled-c']);
            } else {
                endNextLi.click(function () {
                    that._triggerPage(pi.endNextPage);
                });
            }
            this.node.append(endNextLi);
        },
        _triggerPage: function(page){
            var arg = {};
            arg[this.widget.pagination.options['ed-pk']] = page;
            this.trigger(this.widget.pagination.options['event'], [arg]);
        },
        _createLi: function (txt) {
            var li = $("<li />");
            var a = $("<a href='javascript:;'>" + txt + "</a>");
            li.append(a);
            return li;
        }
    });
})(jQuery);
