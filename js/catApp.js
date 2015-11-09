/*--------------------------------------------------

Advocate - CAT
Angular CAT App Definition [catApp.js]

Joe Morrow <joe@joinadvocate.com>
9/23/2015

Copyright @ 2015 by Advocate

--------------------------------------------------*/

var app = angular.module("catApp", []);

// http://stackoverflow.com/questions/14512583/how-to-generate-url-encoded-anchor-links-with-angularjs/31559624#31559624
app.filter('escape', function() {
	return function (input) {
		if (input)
			return window.encodeURIComponent(input); 
		return "";
	}
});

app.filter('stringify', function() {
	return function (input) {
		if (input)
			return JSON.stringify(input); 
		return "";
	}
});

