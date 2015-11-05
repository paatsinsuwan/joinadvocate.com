
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

		// TODO:  Handle the CORS error

		$.ajax({
			url: $(this).attr("action"), 
			data: $(this).serialize(),
			success: function(data) {
				consoleLog("success");
			},
			error: function(jqXHR) {
				consoleLog("error");
			},
			complete: function completeCallback(data) {
				consoleLog("complete!");
				consoleLog(data);

				$("body").append("<p>Thanks!</p>");


/*
This is the Google Spreadsheet:


<iframe src="
		https://docs.google.com/spreadsheets/d/1f_GAYfF76upMt2Us3kuVCK92Zc93np82U_yoq-MXeQo/pubhtml?gid=677216200&amp;single=true&amp;widget=true&amp;headers=false"></iframe>
		https://docs.google.com/spreadsheets/d/1f_GAYfF76upMt2Us3kuVCK92Zc93np82U_yoq-MXeQo/pubhtml


Using google Spreadsheets as a Database with the Google Visualization API Query Language - OUseful.Info, the blog...
http://blog.ouseful.info/2009/05/18/using-google-spreadsheets-as-a-databace-with-the-google-visualisation-api-query-language/
*/

				// Grab the count of rows in the spreadsheet
				var theOptions = "tqx=responseHandler:gsCallback"; // + "&tqx=out:html";
				var theQuery = "select+count(A)";
				var theKey = "1f_GAYfF76upMt2Us3kuVCK92Zc93np82U_yoq-MXeQo";

				$.get("http://spreadsheets.google.com/tq", theOptions + "&tq=" + theQuery + "&key=" + theKey, null, "script");
			}
		});

		event.preventDefault();
	});



});


// Callback function for the Google Spreadsheet query
function gsCallback(data) {
	consoleLog("gsCallback");
	consoleLog(data);

	$("body").append("<p>This was response number " + data.table.rows[0].c[0].v + "</p>");
	$("body").append("<p>You can also <a href=\"http://spreadsheets.google.com/tq?tqx=out:html&tq=select+*&key=1f_GAYfF76upMt2Us3kuVCK92Zc93np82U_yoq-MXeQo\">view the entire list</a>.</p>");

}

