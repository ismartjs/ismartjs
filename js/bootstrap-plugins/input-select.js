+function ($) {

    "use strict";
    $(document).delegate("input,textarea", "focus", function () {
        var node = $(this);
        if (node.attr("data-focus-select") == 'false') {
            return;
        }
        setTimeout(function () {
            if(document.activeElement != node[0]){
                return;
            }
            node.select();
        }, 100);
    })

}(jQuery)