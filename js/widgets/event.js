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
            if(result.done && $.isFunction(result.done)){//说明这个是deferred对象
                var target = $(e.target);
                target.attr("disabled", 'disabled').addClass("disabled");
                result.always(function(){
                    target.removeAttr("disabled").removeClass("disabled");
                });
            }
            return result;
        });
    };
    Smart.widgetExtend({id:"event",options:"type,action"}, {
        onPrepare: function(){
            var action = this.options.event['action'];
            var event = this.options.event["type"];
            bindEvent(this, event, action);
        }
    });
    Smart.widgetExtend({id:"click",options:"action"}, {
        onPrepare: function(){
            var action = this.options.click['action'];
            bindEvent(this, "click", action);
        }
    });
    Smart.widgetExtend({id:"change",options:"action"}, {
        onPrepare: function(){
            var action = this.options.change['action'];
            bindEvent(this, "change", action);
        }
    });
    Smart.widgetExtend({id:"focus",options:"action"}, {
        onPrepare: function(){
            var action = this.options.focus['action'];
            bindEvent(this, "focus", action);
        }
    });
    Smart.widgetExtend({id:"blur",options:"action"}, {
        onPrepare: function(){
            var action = this.options.blur['action'];
            bindEvent(this, "blur", action);
        }
    });
    Smart.widgetExtend({id:"dblclick",options:"action"}, {
        onPrepare: function(){
            var action = this.options.dblclick['action'];
            bindEvent(this, "dblclick", action);
        }
    });
    Smart.widgetExtend({id:"mouseover",options:"action"}, {
        onPrepare: function(){
            var action = this.options.mouseover['action'];
            bindEvent(this, "mouseover", action);
        }
    });
    Smart.widgetExtend({id:"mousemove",options:"action"}, {
        onPrepare: function(){
            var action = this.options.mousemove['action'];
            bindEvent(this, "mousemove", action);
        }
    });
    Smart.widgetExtend({id:"mouseout",options:"action"}, {
        onPrepare: function(){
            var action = this.options.mouseout['action'];
            bindEvent(this, "mouseout", action);
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
            this.node.on(this.options.stopPropagation.events, function(e){
                e.stopPropagation();
            });
        }
    })
})();