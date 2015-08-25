/**
 * Created by Administrator on 2014/7/14.
 */
(function(){
    Smart.widgetExtend({
        id: "editable",
        options: "url,method",
        defaultOptions:{
            method: "put"
        }
    },{
        onPrepare: function(){
            var that = this;
            this.S.node.delegate("*[s-editable-role='i']", "change", function(e){
                that.S._submit($(e.target));
                e.stopPropagation();
            });
        }
    },{
        _submit:function(node){
            var that = this;
            node.addClass("focus");
            function submit(){
                var name = node.attr("name");
                var val = node.attr("s-editable-val") || node.val();
                var data = {};
                data[name] = val;
                that[that.widget.editable.options.method](that.widget.editable.options.url, data).done(function(){
                    that.reset();
                    node.removeClass("focus");
                });
            }

            if("validateNode" in this && $.isFunction(this.validateNode)){//说明该控件是验证控件
                this.validateNode(node).done(function(){
                    submit();
                });
            } else {
                submit();
            }

        }
    });
})()