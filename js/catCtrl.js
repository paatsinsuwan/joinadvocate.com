/*--------------------------------------------------

Advocate - CAT
Angular CAT Controllers [catCtrl.js]

Joe Morrow <joe@joinadvocate.com>
9/23/2015

Copyright @ 2015 by Advocate

--------------------------------------------------*/

// Home Page Controller
app.controller("catHomeCtrl", function($scope) {
	console.debug("initializing catHomeCtrl");

	// Set the default debugging level
	window.console.debugLevel = 2;

	// Add the Join Advocate form to the page
//	ModalForm.prototype.getJoinForm();

	// Initialize the JS

// TODO:  Pass the URL as an argument into the ModalForm object at initialization, so we can vary the form we load

	var theForm1 = "join";
	$scope.page = new Page("#loc-location", "#loc-hidden", true, null, [
//		["#" + theForm + "-modal", "header a.join", "#" + theForm + "-modal a.close, #" + theForm + "-modal form button.reset", "Join Advocate", "#" + theForm + "-modal form"]
		["#modal-" + theForm1, "header a.join, #joinPromo a.join, #signUpPromo a.join", "#modal-" + theForm1 + " .close, #modal-" + theForm1 + " form button.reset", "Join Advocate", "#modal-" + theForm1 + " form", theForm1 + ".html"]
	]);

});


// Results Page Controller
app.controller("catResultsCtrl", function($scope) {
	console.debug("initializing catResultsCtrl");

	// Set the default debugging level
	window.console.debugLevel = 2;

	// Add the Join Advocate form to the page
//	ModalForm.prototype.getJoinForm();

	// Initialize the JS

// TODO:  Pass the URL as an argument into the ModalForm object at initialization, so we can vary the form we load

	var theForm1 = "join";
	var theForm2 = "invite";
	$scope.page = new Page("#loc-location", "#loc-hidden", true, null, [
		["#modal-" + theForm1, "header a.join, #signUpPromo a.join", "#modal-" + theForm1 + " .close, #modal-" + theForm1 + " form button.reset", "Join Advocate", "#modal-" + theForm1 + " form", theForm1 + ".html"],
//		["#modal-" + theForm1, "a.invite", "#modal-" + theForm1 + " a.close, #modal-" + theForm1 + " form button.reset", "Join Advocate", "#modal-" + theForm1 + " form", theForm1 + ".html"]
		["#modal-" + theForm2, "a.invite", "#modal-" + theForm2 + " .close, #modal-" + theForm2 + " form button.reset", "Invite Representatives", "#modal-" + theForm2 + " form", theForm2 + ".html"]
	], "#map", "#results");

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
	console.debug("initializing catDetailsCtrl");

	// Set the default debugging level
	window.console.debugLevel = 2;

	// Add the Join Advocate form to the page
//	ModalForm.prototype.getJoinForm();

	// Initialize the JS
// TODO:  Pass the URL as an argument into the ModalForm object at initialization, so we can vary the form we load

	var theForm1 = "join";
	var theForm2 = "invite";
	var theForm3 = "claim";
//	$scope.page = new Page("#loc-location", "#loc-hidden", true, null, [["#" + theForm + "-modal", "header a.join", "#" + theForm + "-modal a.close, #" + theForm + "-modal form button.reset", "Join Advocate", "#" + theForm + "-modal form"]], "#map", null, "#main", "#votes");

	$scope.page = new Page("#loc-location", "#loc-hidden", true, null, [
//		["#" + theForm1 + "-modal", "header a.join", "#" + theForm1 + "-modal a.close, #" + theForm1 + "-modal form button.reset", "Join Advocate", "#" + theForm1 + "-modal form"]
		["#modal-" + theForm1, "header a.join, #joinPromo a.join, #signUpPromo a.join", "#modal-" + theForm1 + " .close, #modal-" + theForm1 + " form button.reset", "Join Advocate", "#modal-" + theForm1 + " form", theForm1 + ".html"],
//		["#" + theForm2 + "-modal", "#invite a.invite", "#" + theForm2 + "-modal a.close, #" + theForm2 + "-modal form button.reset", "Invite Representatives", "#" + theForm2 + "-modal form"],
		["#modal-" + theForm2, "#invite a.invite", "#modal-" + theForm2 + " .close, #modal-" + theForm2 + " form button.reset", "Invite Reps", "#modal-" + theForm2 + " form", theForm2 + ".html"],
		["#modal-" + theForm3, "#actions a.claim", "#modal-" + theForm3 + " .close, #modal-" + theForm3 + " form button.reset", "Claim Your Profile", "#modal-" + theForm3 + " form", theForm3 + ".html"]
	], "#map", null, "#main", "#votes");


	$scope.page.setNgScope($scope);

	// Set up various page content
	$scope.cityState = function(pre) {
		if ($scope.page.location.getLocationIsGeocoded())
			return ((typeof pre != "undefined") ? pre : "") + $scope.page.location.getLocationCity() + ", " + $scope.page.location.getLocationState();
	};

	// Draw the Google map
	$scope.page.map.draw();

	// Build the Rep List
//	$scope.page.repList.load();

});


// Contact Us Controller
app.controller("catContactCtrl", function($scope) {
	console.debug("initializing catContactCtrl");

	// Set the default debugging level
	window.console.debugLevel = 2;

	// Add the Join Advocate form to the page
//	ModalForm.prototype.getJoinForm();

	// Initialize the JS
//	$scope.page = new Page("form.contact fieldset.location input.location", "form.contact fieldset.location input.hidden", false, null, [["#join", "header a.join", "#join a.close, form.join button.reset", "Join Advocate", "form.join"]]);
//	$scope.page = new Page("form.contact fieldset.location input.location", "form.contact fieldset.location input.hidden", false, null, null);
	$scope.page = new Page(".modal form fieldset.location input.location", ".modal form fieldset.location input.hidden", false, null, null);

	// Set up the form submission
	$("form").submit(function(event) {
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
		$("input.userAgent", that).val(navigator.userAgent);
		if (typeof WURFL != "undefined")
			$("input.device", that).val(JSON.stringify(WURFL));	// Requires wurfl.js


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
				console.debug(that, 2);
				console.debug(this, 2);

// TODO:  Show thank you message


				$(that).siblings(".thanks").find("button.close").html("Go back").click(function() {
					window.history.go(-1);
				});
				$(that).parents(".modal").addClass("complete");

//				alert("submitted!");


//				window.location.replace("thank-you.html");
/*
				$(that).hide();
				$(that).parent().append("<section><p>Thank you message</p></section>");
*/
				$scope.page.stopLoading();
			}
		});

		event.preventDefault();
		return false;
	});

	$scope.page.setNgScope($scope);

	// Set up various page content
	$scope.cityState = function(pre) {
		if ($scope.page.location.getLocationIsGeocoded())
			return ((typeof pre != "undefined") ? pre : "") + $scope.page.location.getLocationCity() + ", " + $scope.page.location.getLocationState();
	};

});

window.console.debugLevel = 2;
