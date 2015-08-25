/**
 * Created by Administrator on 2014/6/28.
 */
(function($){
    //表单提交插件，作用于submit按钮，可以实现表单回车提交
    Smart.widgetExtend({
        id:"submit",
        options: "ctx:action,ctx:done,ctx:fail,ctx:always,reset",
        defaultOptions:{reset:"false"}
    }, {
        onPrepare: function(){
            var that = this;
            this.cache.action = this.S.node.attr("action");
            this.cache.method = this.S.node.attr("method") || "post";
            this.cache.enctype = this.S.node.attr("enctype") || "application/x-www-form-urlencoded";
            var submitBtn = this.S.node.find(":submit")
            this.S.node[0].onsubmit = function(e){
                e.stopPropagation();
                try{
                    Smart.disableNode(submitBtn);
                    that.S.submit().always(function(){
                        Smart.disableNode(submitBtn, false);
                    });
                } catch(e){
                    Smart.error(e);
                }
                return false;
            };
        },
        onReset: function(){
            this.S.node[0].reset();
        }
    },{
        submit: function(){
            var deferred = $.Deferred();
            if(!('action' in this.widget.submit.options) && Smart.isEmpty(this.widget.submit.cache.action)) {
                return deferred.resolve();
            }
            var that = this;
            if(this.widget.submit.options.action){//如果定义了submit action，则直接执行该action
                var actionSubmit = function(){
                    var result = that.widget.submit.options.action.call(that);
                    if(Smart.isDeferred(result)){//说明是deferred对象
                        result.always(function(){
                            deferred.resolve();
                        });
                    } else {
                        deferred.resolve();
                    }
                };
                if("validate" in this){
                    this.validate().done(actionSubmit).fail(function(){
                        deferred.reject();
                    });
                } else {
                    actionSubmit();
                }

                return deferred;
            }
            var submit = function(){
                var data;
                switch(that.widget.submit.cache.enctype){
                    case "multipart/form-data" : data = Smart.formData(that.node); break;
                    case "application/x-www-form-urlencoded" :
                        data = Smart.serializeToObject(that.node); break;
                }
                that[that.widget.submit.cache.method](that.widget.submit.cache.action, data)
                    .done(function(rs){
                        that.widget.submit.options.done && that.widget.submit.options.done.call(that, rs);
                        if(that.widget.submit.options.reset == 'true'){
                            that.reset();
                        }
                        deferred.resolve(rs);
                    }).fail(function(){
                        deferred.reject.apply(deferred, $.makeArray(arguments));
                        that.widget.submit.options.fail && that.widget.submit.options.fail.apply(that, $.makeArray(arguments));
                    }).always(function(){
                        that.widget.submit.options.always && that.widget.submit.options.always.call(that);
                    });
            };

            //证明该form是需要验证的
            if("validate" in this){
                this.validate().done(function(){
                    submit();
                }).fail(function(){
                    deferred.reject();
                });
            } else {
                submit();
            }
            return deferred;
        }
    });
})(jQuery);