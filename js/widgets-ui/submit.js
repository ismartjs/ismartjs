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
            this.dataTable("submit", "action", this.node.attr("action"));
            this.dataTable("submit", "method", this.node.attr("method") || "post");
            this.dataTable("submit", "enctype", this.node.attr("enctype") || "application/x-www-form-urlencoded");
            var submtBtn = this.node.find(":submit")
            this.node[0].onsubmit = function(e){
                e.stopPropagation();
                try{
                    var deferred = $.Deferred();
                    Smart.disableNode(submtBtn);
                    deferred.done(function(){
                        Smart.disableNode(submtBtn, false);
                    });
                    that.submit(deferred);
                } catch(e){
                    Smart.error(e);
                }
                return false;
            };
        }
    },{
        submit: function(deferred){
            if(!('action' in this.options.submit) && Smart.isEmpty(this.dataTable("submit", "action"))) {
                return deferred.resolve();
            }
            var that = this;
            if(this.options.submit.action){//如果定义了submit action，则直接执行该action
                var actionSubmit = function(){
                    var result = that.options.submit.action.call(that);
                    if(Smart.isDeferred(result)){//说明是deferred对象
                        result.always(function(){
                            deferred.resolve();
                        });
                    } else {
                        deferred.resolve();
                    }
                };
                if("validate" in this){
                    this.validate().done(actionSubmit);
                } else {
                    actionSubmit();
                }

                return;
            }
            var data;
            switch(this.dataTable("submit", "enctype")){
                case "multipart/form-data" : data = Smart.formData(this.node); break;
                case "application/x-www-form-urlencoded" :
                    data = Smart.serializeToObject(this.node); break;
            }

            var submit = function(){
                that[that.dataTable("submit", "method")](that.dataTable("submit", "action"), data)
                    .done(function(rs){
                        that.options.submit.done && that.options.submit.done.call(that, rs);
                        if(that.options.submit.reset == 'true'){
                            that.node[0].reset();
                        }
                }).fail(function(){
                    that.options.submit.done && that.options.submit.done.apply(that, $.makeArray(arguments));
                }).always(function(){
                    that.options.submit.always && that.options.submit.always.call(that);
                    deferred.resolve();
                });
            };

            //证明该form是需要验证的
            if("validate" in this){
                this.validate().done(function(){
                    submit();
                }).fail(function(){
                    deferred.resolve();
                });
            } else {
                submit();
            }

        }
    });
})(jQuery);