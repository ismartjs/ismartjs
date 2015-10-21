/**
 * Created by nana on 2015/9/21.
 */
(function ($) {
    Smart.widgetExtend({
        id: "event"
    }, {
        onPrepare: function () {
            var that = this;
            $.each(this.options, function(evt, action){
                that.S.node.on(evt, function(e){
                    action.call(this, e);
                });
            });
        }
    });
})(jQuery);
