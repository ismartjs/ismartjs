(function($){

    Smart.extend({
        "loading": function(options){

            options = $.extend({
                "node": null,
                "thisRef": null,
                "toggleClass": null,
                "toggleText": null,
                "action": $.noop(),
            }, options || {});

            if(!options.node){
                Smart.error("错误的node设定");
                return;
            }
            var node = $(options.node);
            if(options.toggleClass){
                options.node.addClass(options.toggleClass);
            }
            var _node_text;
            if(options.toggleText){
                if(node.is("input")){
                    _node_text = node.val();
                    node.val(options.toggleText);
                } else {
                    _node_text = node.html();
                    node.html(options.toggleText);
                }
            }
            function reset(){
                if(options.toggleClass){
                    node.removeClass(options.toggleClass);
                }
                if(options.toggleText){
                    if(node.is("input")){
                        node.val(_node_text);
                    } else {
                        node.html(_node_text);
                    }
                }
            }
            var deferred = options.action.call(options.thisRef);
            if(Smart.isDeferred(deferred)){
                deferred.always(function(){
                    reset();
                });
            } else {
                if(options.toggleClass){
                    reset();
                }
            }
            return deferred;
        }
    })

})(jQuery);