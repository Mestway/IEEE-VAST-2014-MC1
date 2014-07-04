var INDEX_enable_drag = false;
$(function() {
    $( "#text_board" ).draggable();
    $( "#resume_component").draggable();
  	$( "#text_board" ).draggable("disable");
	$( "#resume_component").draggable("disable");

    $("#main_panel > .enable_drag")
    .click(function() {
        INDEX_enable_drag = 1 - INDEX_enable_drag;
        if (INDEX_enable_drag) {
        	$("#text_board").draggable("enable");
        	$("#resume_component").draggable("enable");
        } else {
        	$( "#text_board" ).draggable("disable");
    		$( "#resume_component").draggable("disable");
        }
    });
});