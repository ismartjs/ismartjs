/**
 * Created by Administrator on 2014/6/19.
 */
(function(){
    Smart.extend({
        eventAction: (function () {

            var getActionSmart = function (smart) {
                if (smart.action) {
                    return smart;
                }
                var parent = smart.parent();
                if (parent == null || parent.isWindow()) {
                    return null;
                }
                return getActionSmart(parent);
            };

            return function (smart, script) {
                var actionSmart = getActionSmart(smart);
                var script_body = [];
                script_body.push("var e = arguments[1];");
                script_body.push(script);
                if (actionSmart == null) {
                    var window_body = [];
                    window_body.push("(function(){");
                    window_body.push("      return function(){");
                    window_body.push("          "+script_body.join("\n"));
                    window_body.push("      }")
                    window_body.push("})()");
                    return eval(window_body);
                } else {
                    return actionSmart.action(script_body.join("\n"));
                }
            }
        })()
    });
    var bindEvent = function(smart, event, action){
        if(Smart.isEmpty(event) || Smart.isEmpty(action)){
            return;
        }
        action = Smart.eventAction(smart, action);
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