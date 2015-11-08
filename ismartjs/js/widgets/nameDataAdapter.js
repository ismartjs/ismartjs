/**
 * Created by Administrator on 2014/6/21.
 */
(function(){
    //将该元素的所有 拥有 name 属性的子元素 适配成可接受赋值的控件，即默认的控件。
    //name的值作为 data-key的值，data-accept设置为true
    Smart.widgetExtend("nda", {
        onPrepare: function(){
            this.S.node.find("*[name]").each(function(){
                var nameNode = $(this);
                var ig = nameNode.attr('s-nda-ig');
                if(ig && ($.trim(ig) == "" || $.trim(ig) == 'true')){
                    return;
                }
                if(!Smart.isWidgetNode(nameNode)){
                    //如果不是控件
                    //则把它声明成为一个基本控件
                    nameNode.attr(Smart.DEFINE_KEY, "");
                }
                var attrName = Smart.optionAttrName("data", "filter");
                if(Smart.isEmpty(nameNode.attr(attrName))){
                    nameNode.attr(attrName, "'"+nameNode.attr("name")+"'");
                }
            });
        }
    });
})();