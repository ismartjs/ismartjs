/**
 * Created by nana on 2015/9/17.
 */
(function ($) {
    Smart.widgetExtend({
        id: "popover",
        defaultOptions: {
            trigger: "focus"
        }
    }, {
        onPrepare: function () {
            this.S.node.popover(this.options);
        }
    });
})(jQuery);