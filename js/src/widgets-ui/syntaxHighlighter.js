/**
 * Created by nana on 2015/10/8.
 */
(function ($) {
    //options phase
    var SOURCE_KEY = "_SH_SOURCE_";
    Smart.widgetExtend({
        id: "sh",
        defaultOptions: {
            phase: "render",
            sourceNode: null,
            source: null,
            brush: "Xml",
            brushOption: {toolbar: false, 'html-script': true}
        }
    }, {
        onPrepare: function () {
            if (this.options.phase == "source") {
                var html = $("<div></div>").append(this.S.node.html());
                html.find("*[_id_]").each(function(){
                    var node = $(this);
                    node.attr("id", node.attr("_id_")).removeAttr("_id_");
                });
                html.find("*[s-sh-role]").each(function(){
                   var node = $(this);
                    if(node.attr("s-sh-role") == "javascript"){
                        node.attr('type', "text/javascript");
                    }
                    node.removeAttr("s-sh-role");
                });
                this.S.node.data(SOURCE_KEY, html.html());
                return;
            }
        },
        onReady: function(){
            if (this.options.phase == "render") {
                var source;
                if (this.options.sourceNode) {
                    source = this.options.sourceNode.data(SOURCE_KEY) || this.options.sourceNode.html();
                } else if(this.options.source){
                    source = this.options.source;
                    if($.isFunction(source)){
                        source = source();
                    }
                }
                else {
                    source = this.S.node.html();
                }
                //var code = source.replace(/</gi, "&lt;").replace(/>/gi, "&gt;");
                var brush = new SyntaxHighlighter.brushes[this.options.brush]();
                brush.init(this.options.brushOption);
                this.S.node.html(brush.getHtml(source));
            }
        }
    });
})(jQuery);
