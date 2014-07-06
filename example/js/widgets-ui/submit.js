/**
 * Created by Administrator on 2014/6/28.
 */
(function($){
    //表单提交插件，作用于submit按钮，可以实现表单回车提交
    Smart.widgetExtend({id:"submit"}, {
        onPrepare: function(){
            var form = this.node.closest("form");
            if(form.size() == 0){
                return;
            }
            form[0].onsubmit = function(e){
                e.stopPropagation();
                return false;
            };

        }
    });
})(jQuery);