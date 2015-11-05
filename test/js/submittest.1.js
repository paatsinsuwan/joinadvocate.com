
// Debugging function
var debug = false;
function consoleLog(msg) {
	if (debug)
		console.log(msg)
}



$(function() {



	debug = true;


	$("form").submit(function(event) {
		consoleLog("submitted!");
		consoleLog(event);

		$("input.referer", this).val(window.location.href);
		// TODO:  Get the location

		var theUrl = $(this).attr("action");
		var theData = $(this).serialize();
		
		consoleLog("theUrl = " + theUrl);
		consoleLog("theData = " + theData);

		$.ajax({
			url: theUrl, 
			data: theData,
//			dataType: "jsonp",
//			jsonp: "callback",
			success: function(data) {
				consoleLog("success");
			},
			error: function(jqXHR) {
				consoleLog("error");
			},
			complete: completeCallback
/*
		}).fail(function() {
			alert("fail");
		}).always(function() {
			alert("always");
*/
		});

		event.preventDefault();
	});

	function completeCallback(data) {
		alert("complete!");
		consoleLog(data);
	}

});

