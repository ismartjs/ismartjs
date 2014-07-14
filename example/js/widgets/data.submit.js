/**
 * Created by Administrator on 2014/7/11.
 */
(function(){
    /**
     * grid数据删除控件
     * */
    Smart.widgetExtend({
        id: "dataSubmit",
        options: "ctx:data,url,type,listener",
        defaultOptions: {
            "type": "post"
        }
    },{
        onPrepare: function(){
            var that = this;
            Smart.clickDeferred(this.node, $.proxy(this.submit, this));
            this.on("submit-done", function(e){
                e.stopPropagation();
                that.options.listener && that.options.listener.done
                && that.options.listener.done.apply(null, Smart.SLICE.call(arguments, 1));
            });
            this.on("submit-fail", function(e){
                e.stopPropagation();
                that.options.listener && that.options.listener.fail
                && that.options.listener.fail.apply(null, Smart.SLICE.call(arguments, 1));
            });
        }
    },{
        getSubmitData: function(deferred){
            var data = this.options.dataSubmit['data'];
            if(!$.isFunction(data)){
                deferred.resolve(data);
            } else {
                deferred.resolve(data());
            }
        },
        submit: function(){
            var that = this;
            var deferred = $.Deferred();
            this.getSubmitData(deferred);
            var submitDeferred = $.Deferred();
            deferred.done(function(data){
                that[that.options.dataSubmit.type](that.options.dataSubmit.url, data).done(function(){
                    that.trigger.apply(that, ["submit-done"].concat($.makeArray(arguments)))
                    submitDeferred.resolve();
                }).fail(function(){
                    that.trigger.apply(that, ["submit-fail"].concat($.makeArray(arguments)))
                    submitDeferred.reject();
                });
            }).fail(function(){
                submitDeferred.reject();
            });
            return submitDeferred;
        }
    });
})();