$(document).delegate("input[data-input-highlight],input[data-change-highlight],select[data-input-highlight],select[data-change-highlight]", "change", function(){
    var node = $(this);
    var val = node.val();
    if(val == ""){
        node.removeClass(node.attr('data-change-highlight') || node.attr('data-input-highlight'));
    } else {
        node.addClass(node.attr('data-change-highlight') || node.attr('data-input-highlight'));
    }
})