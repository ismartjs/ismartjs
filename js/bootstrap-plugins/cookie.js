+function ($) {

    "use strict";
    $(document).delegate("*[data-cookie]", "change", function () {
        var node = $(this);
        $.cookie(node.attr("data-cookie"), node.val(), {
            expires: parseFloat(node.attr("data-cookie-expires")) || 0
        });
    })

}(jQuery)