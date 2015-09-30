/*--------------------------------------------------

Advocate - CAT
Angular CAT Controllers [catCtrl.js]

Joe Morrow <joe@joinadvocate.com>
9/23/2015

Copyright @ 2015 by Advocate

--------------------------------------------------*/

app.controller("catHomeCtrl", function($scope) {

	// Set the default debugging level
	window.console.debugLevel = 1;

	$scope.page = new Page("#loc-location", "#loc-hidden", null, ["#join"]);
});

app.controller("catResultsCtrl", function($scope) {

	// Set the default debugging level
	window.console.debugLevel = 2;

	$scope.page = new Page("#loc-location", "#loc-hidden", null, ["#join"], "#map", "#results");
	$scope.page.setNgScope($scope);

	// Set up various page content
	$scope.cityState = function(pre) {
		if ($scope.page.location.getLocationIsGeocoded())
			return pre + $scope.page.location.getLocationCity() + ", " + $scope.page.location.getLocationState();
	};

	// Draw the Google map
	$scope.page.map.draw();

	// Build the Rep List
	$scope.page.repList.load();

});

window.console.debugLevel = 2;
