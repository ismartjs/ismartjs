/**
 * Created by Administrator on 2014/6/27.
 */
(function ($) {

    //分页控件
    Smart.widgetExtend({
        id: "pager",
        options: "pagekey,pageSizeKey,totalKey,disabledClass",
        defaultOptions: {
            action: $.noop(),
            'pagekey': "page",
            'pageSizeKey': "pageSize",
            'totalKey': "total",
            "disabledClass": "disabled"
        }
    }, {
        onPrepare: function(){
            var that = this;
            this.S.node.delegate(".s-pager-prev, .s-pager-next", "click", function(e){
                var node = $(this);
                if(node.hasClass(that.options.disabledClass)){
                    return;
                }
                that.options.action.call(node.attr("_s-pager-page"), node.attr("_s-pager-page"), that.S);
            });
        }
    }, {
        dataSetter: function (data) {
            var page = parseInt(data[this.widget.pager.options['pagekey']]);
            var total = parseInt(data[this.widget.pager.options['totalKey']]);
            var pageSize = parseInt(data[this.widget.pager.options['pageSizeKey']]);
            var totalPage = Math.ceil(total / pageSize);
            var preBtn = this.node.find(".s-pager-prev");
            var netxtBtn = this.node.find(".s-pager-next");
            if(page <= 1){
                preBtn.addClass(this.widget.pager.options.disabledClass).prop("disabled", true);
            } else {
                preBtn.removeClass(this.widget.pager.options.disabledClass).attr("_s-pager-page", page - 1).prop("disabled", false);
            }
            if(page >= totalPage){
                netxtBtn.addClass(this.widget.pager.options.disabledClass).prop("disabled", true);
            } else {
                netxtBtn.removeClass(this.widget.pager.options.disabledClass).attr("_s-pager-page", page + 1).prop("disabled", false);
            }
        }
    });
})(jQuery);
