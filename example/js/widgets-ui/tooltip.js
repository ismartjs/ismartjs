(function ($) {
    Smart.widgetExtend({
        id: "tooltip"
    }, {
        onPrepare: function () {
            this.S.node.tooltip()
        }
    });
})(jQuery);
