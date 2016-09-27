$(document).delegate("select[data-highlight]", "change", function(){
    var select = $(this);
    var val = select.val();
    if(val == ""){
        select.removeClass(select.attr('data-highlight'));
    } else {
        select.addClass(select.attr('data-highlight'));
    }
})