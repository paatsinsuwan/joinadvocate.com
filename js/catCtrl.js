/*--------------------------------------------------

Advocate - CAT
Angular CAT Controllers [catCtrl.js]

Joe Morrow <joe@joinadvocate.com>
9/23/2015

Copyright @ 2015 by Advocate

--------------------------------------------------*/

// Home Page Controller
app.controller("catHomeCtrl", function($scope) {

	// Set the default debugging level
	window.console.debugLevel = 1;

	// Add the Join Advocate form to the page
	ModalForm.prototype.getJoinForm();

	// Initialize the JS
	$scope.page = new Page("#loc-location", "#loc-hidden", true, null, [["#join", "header a.join", "#join a.close, form.join button.reset", "form.join"]]);
});

// Results Page Controller
app.controller("catResultsCtrl", function($scope) {

	// Set the default debugging level
	window.console.debugLevel = 2;

	// Add the Join Advocate form to the page
	ModalForm.prototype.getJoinForm();

	// Initialize the JS
	$scope.page = new Page("#loc-location", "#loc-hidden", true, null, [["#join", "header a.join, #joinPromo a.button", "#join a.close, form.join button.reset", "form.join"]], "#map", "#results");
	$scope.page.setNgScope($scope);

	// Set up various page content
	$scope.cityState = function(pre) {
		if ($scope.page.location.getLocationIsGeocoded())
			return ((typeof pre != "undefined") ? pre : "") + $scope.page.location.getLocationCity() + ", " + $scope.page.location.getLocationState();
	};

	// Draw the Google map
	$scope.page.map.draw();

	// Build the Rep List
	$scope.page.repList.load();
});


// Details Page Controller
app.controller("catDetailsCtrl", function($scope) {

	// Set the default debugging level
	window.console.debugLevel = 2;

	// Add the Join Advocate form to the page
	ModalForm.prototype.getJoinForm();

	// Initialize the JS
	$scope.page = new Page(null, null, false, null, [["#join", "header a.join, #joinPromo a.button", "#join a.close, form.join button.reset", "form.join"]], null, null, "#main", "#votes");
	$scope.page.setNgScope($scope);

	// Set up various page content
	$scope.cityState = function(pre) {
		if ($scope.page.location.getLocationIsGeocoded())
			return ((typeof pre != "undefined") ? pre : "") + $scope.page.location.getLocationCity() + ", " + $scope.page.location.getLocationState();
	};

	// Draw the Google map
//	$scope.page.map.draw();

	// Build the Rep List
//	$scope.page.repList.load();
});


// Contact Us Controller
app.controller("catContactCtrl", function($scope) {

	// Set the default debugging level
	window.console.debugLevel = 1;

	// Add the Join Advocate form to the page
	ModalForm.prototype.getJoinForm();

	// Initialize the JS
	$scope.page = new Page("form.contact input.location", "form.contact input.hidden", false, null, [["#join", "header a.join", "#join a.close, form.join button.reset", "form.join"]]);

	// Set up the form submission
	$("form.contact").submit(function(event) {
		console.debug("submitting...");
		console.debug(event);

		var that = this;

		// Turn on the loading spinner while the submit happens
		$scope.page.startLoading("Submitting...");

/*
		This is the Google Spreadsheet:

		<iframe src="
			https://docs.google.com/spreadsheets/d/1f_GAYfF76upMt2Us3kuVCK92Zc93np82U_yoq-MXeQo/pubhtml?gid=677216200&amp;single=true&amp;widget=true&amp;headers=false"></iframe>
			https://docs.google.com/spreadsheets/d/1f_GAYfF76upMt2Us3kuVCK92Zc93np82U_yoq-MXeQo/pubhtml

		Using google Spreadsheets as a Database with the Google Visualization API Query Language - OUseful.Info, the blog...
		http://blog.ouseful.info/2009/05/18/using-google-spreadsheets-as-a-databace-with-the-google-visualisation-api-query-language/
*/

		$("input.referer", that).val(window.location.href);


		// Submit the form to Google Spreadsheets via AJAX
		$.ajax({
			url: $(that).attr("action"), 
			data: $(that).serialize(),
			success: function(data) {
				console.debug("success");
			},
			error: function(jqXHR) {
				console.debug("error");

// TODO:  Handle the CORS error

			},
			complete: function completeCallback(data) {
				console.debug("complete!");
				console.debug(data, 2);

// TODO:  Show thank you message

				$(that).hide();
				$(that).parent().append("<section><p>Thank you message</p></section>");

				$scope.page.stopLoading();
			}
		});

		event.preventDefault();
		return false;
	});




});






window.console.debugLevel = 2;
