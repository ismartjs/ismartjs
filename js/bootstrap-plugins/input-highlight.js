$(document).delegate("input[data-input-highlight],select[data-input-highlight]", "change", function(){
    var node = $(this);
    var val = node.val();
    if(val == ""){
        node.removeClass(node.attr('data-input-highlight'));
    } else {
        node.addClass(node.attr('data-input-highlight'));
    }
})