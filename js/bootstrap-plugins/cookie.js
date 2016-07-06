+function ($) {

    "use strict";
    $(document).delegate("*[data-cookie]", "change", function () {
        var node = $(this);
        $.cookie(node.attr("data-cookie"), node.val());
    })

}(jQuery)