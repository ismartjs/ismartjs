/**
 * Created by Administrator on 2014/6/27.
 */
(function ($) {

    var paging = function (page, pageSize, totalCount, showSize) {
        showSize = showSize || 10;
        page = page < 1 ? 1 : parseInt(page);
        pageSize = parseInt(pageSize)
        totalCount = parseInt(totalCount)
        showSize = parseInt(showSize)
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
        var prePage = 0;
        var nextPage = 0;
        if(page > 1) prePage = page - 1;
        if(page < totalPage) nextPage = page + 1;
        var startNum = (page - 1) * pageSize + 1;
        var endNum = startNum + pageSize - 1;
        if (endNum > totalCount)
            endNum = totalCount;
        totalPage = totalPage || 1;
        endPage = endPage || 1;
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
        options: "pagekey,pageSizeKey,totalKey,showSize,startText,endText,disabledClass,activeClass,preText,nextText,action",
        defaultOptions: {
            'pagekey': "page",
            'pageSizeKey': "pageSize",
            'totalKey': "total",
            "showSize": 11,
            "startText": "&laquo;",
            "endText": "&raquo;",
            "preText": "‹",
            "nextText": "›",
            "disabledClass": "disabled",
            "activeClass": "active"
        }
    }, {
        onPrepare: function(){
        }

    }, {
        dataSetter: function (data) {
            var pi = paging(data[this.widget.pagination.options['pagekey']],
                data[this.widget.pagination.options['pageSizeKey']],
                data[this.widget.pagination.options['totalKey']],
                data[this.widget.pagination.options['showSize']]);
            this.node.empty();
            var startPreLi = this._createLi(this.widget.pagination.options['startText']);
            if (pi.startPrePage <= 0) {
                startPreLi.addClass(this.widget.pagination.options['disabledClass']);
            } else {
                startPreLi.click(function () {
                    that._triggerPage(pi.startPrePage);
                });
            }
            this.node.append(startPreLi);
            var preLi = this._createLi(this.widget.pagination.options.preText);
            if (pi.prePage <= 0) {
                preLi.addClass(this.widget.pagination.options['disabledClass']);
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
                        pageLi.addClass(that.widget.pagination.options['activeClass']);
                    }
                    pageLi.click(function () {
                        that._triggerPage(i);
                    });
                    that.node.append(pageLi);
                })(i);
            }
            var nextLi = this._createLi(this.widget.pagination.options.nextText);
            if (pi.nextPage <= 0) {
                nextLi.addClass(this.widget.pagination.options['disabledClass']);
            } else {
                nextLi.click(function () {
                    that._triggerPage(pi.nextPage);
                });
            }
            this.node.append(nextLi);
            var endNextLi = this._createLi(this.widget.pagination.options['endText']);
            if (pi.endNextPage <= pi.endPage) {
                endNextLi.addClass(this.widget.pagination.options['disabledClass']);
            } else {
                endNextLi.click(function () {
                    that._triggerPage(pi.endNextPage);
                });
            }
            this.node.append(endNextLi);
        },
        _triggerPage: function(page){
            if(this.widget.pagination.options['action']){
                this.widget.pagination.options['action'].call(page);
            }
            this.trigger("pagination-page", [page]);
        },
        _createLi: function (txt) {
            var li = $("<li />").attr("_page", txt);
            var a = $("<a href='javascript:;' >" + txt + "</a>");
            li.append(a);
            return li;
        },
        getPage: function(){
            return this.node.find("li." + this.widget.pagination.options['activeClass']).attr("_page");
        }
    });
})(jQuery);
