/**
 * Created by Administrator on 2014/6/19.
 */
(function(){
    var bindEvent = function(smart, event, action){
        if(Smart.isEmpty(event) || Smart.isEmpty(action)){
            return;
        }
        action = smart.action("var e = arguments[1];\n" + action);
        smart.node[event](function (e) {
            var result = action.call(smart, e);
            if(result == null) return;
            if(Smart.isDeferred(result)){//说明这个是deferred对象
                var target = $(e.target);
                Smart.disableNode(target);
                result.always(function(){
                    Smart.disableNode(target, false);
                });
            }
            return result;
        });
    };
    Smart.widgetExtend({id:"event",options:"type,action"}, {
        onPrepare: function(){
            var action = this.options['action'];
            var event = this.options["type"];
            bindEvent(this.S, event, action);
        }
    });
    Smart.widgetExtend({id:"click",options:"action"}, {
        onPrepare: function(){
            var action = this.options['action'];
            bindEvent(this.S, "click", action);
        }
    });
    Smart.widgetExtend({id:"change",options:"action"}, {
        onPrepare: function(){
            var action = this.options['action'];
            bindEvent(this.S, "change", action);
        }
    });
    Smart.widgetExtend({id:"focus",options:"action"}, {
        onPrepare: function(){
            var action = this.options['action'];
            bindEvent(this.S, "focus", action);
        }
    });
    Smart.widgetExtend({id:"blur",options:"action"}, {
        onPrepare: function(){
            var action = this.options['action'];
            bindEvent(this.S, "blur", action);
        }
    });
    Smart.widgetExtend({id:"dblclick",options:"action"}, {
        onPrepare: function(){
            var action = this.options['action'];
            bindEvent(this.S, "dblclick", action);
        }
    });
    Smart.widgetExtend({id:"mouseover",options:"action"}, {
        onPrepare: function(){
            var action = this.options['action'];
            bindEvent(this.S, "mouseover", action);
        }
    });
    Smart.widgetExtend({id:"mousemove",options:"action"}, {
        onPrepare: function(){
            var action = this.options['action'];
            bindEvent(this.S, "mousemove", action);
        }
    });
    Smart.widgetExtend({id:"mouseout",options:"action"}, {
        onPrepare: function(){
            var action = this.options['action'];
            bindEvent(this.S, "mouseout", action);
        }
    });

    //停止冒泡
    Smart.widgetExtend({
        id : "stopPropagation",
        options: "events",
        defaultOptions: {
            events: "click"
        }
    },{
        onPrepare: function(){
            this.S.node.on(this.options.events, function(e){
                e.stopPropagation();
            });
        }
    })
})();