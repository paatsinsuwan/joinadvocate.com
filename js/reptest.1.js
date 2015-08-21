
// Debugging function
var debug = false;
function consoleLog(msg) {
	if (debug)
		console.log(msg)
}

// Geolocation Test

var m2f = 3.28084;	// Convert 1 meter to feet

// Round off to the nearest tenth
function roundTenth(x) {
	consoleLog("roundTenth(");
	consoleLog(x);

	return (Math.round(x * 10) / 10);
}

// Get the HTML5 geolocation and kick off the page
function initialize() {
	consoleLog("initialize()");

	navigator.geolocation.getCurrentPosition(showMap, showError);
	return false;
}

// HTML5 geolocation error function 
function showError(error) {
	consoleLog("showError(");
	consoleLog(error);

	alert(error);
	return false;
}


// Calculate points around the permieter of a circle in lat,lon coordinates
// http://www.geocodezip.com/v3_polygon_example_donut.html
function drawCircle(point, radius, dir) {
	consoleLog("drawCircle(");
	consoleLog(point);
	consoleLog(radius);
	consoleLog(dir);

	var d2r = Math.PI / 180;  // degrees to radians 
	var r2d = 180 / Math.PI;  // radians to degrees 
	var earthsradius = 3963;  // 3963 is the radius of the earth in miles

	var points = 32;	// Number of points in the circle

	// find the raidus in lat/lon 
	var rlat = (radius / earthsradius) * r2d; 
	var rlng = rlat / Math.cos(point.lat() * d2r); 

	// calculate the list of points 
	var extp = new Array(); 
	if (dir == 1) {
		var start = 0;
		var end = points + 1; // one extra here makes sure we connect the
	} else {
		var start = points + 1;
		var end = 0
	}
	for (var i = start; (dir == 1 ? i < end : i > end); i = i + dir) {
		var theta = Math.PI * (i / (points / 2)); 
		ey = point.lng() + (rlng * Math.cos(theta)); // center a + radius x * cos(theta) 
		ex = point.lat() + (rlat * Math.sin(theta)); // center b + radius y * sin(theta) 
		extp.push(new google.maps.LatLng(ex, ey)); 
		bounds.extend(extp[extp.length - 1]);
	} 

	return extp;
}


// Output info about the current position
function showPosition(position, style) {
	consoleLog("showPosition(");
	consoleLog(position);
	consoleLog(style);

	var x = document.getElementById("location");

	switch (style) {
		case 1:

			x.innerHTML += 
				"<ul>\n" +
				"<li>altitude: " + roundTenth(position.coords.altitude) + " m (" + roundTenth(position.coords.altitude * m2f) + " feet)</li>\n" +
				"<li>altitudeAccuracy: " + roundTenth(position.coords.altitudeAccuracy) + " m (" + roundTenth(position.coords.altitudeAccuracy * m2f) + " feet)</li>\n" +
				"<li>heading: " + position.coords.heading + "</li>\n" +
				"<li>latitude: " + position.coords.latitude + "</li>\n" +
				"<li>longitude: " + position.coords.longitude + "</li>\n" +
				"<li>accuracy: " + roundTenth(position.coords.accuracy) + " m (" + roundTenth(position.coords.accuracy * m2f) + " feet)</li>\n" +
				"<li>speed: " + roundTenth(position.coords.speed) + " m/s</li>\n" +
				"</ul>\n";

			break;
		case 2:
			x.innerHTML += 
				"<p>Your location: " + position.coords.latitude + ", " + position.coords.longitude + " (accurate to within " + roundTenth(position.coords.accuracy * m2f) + " feet)</p>\n";
			break;
		default:
			break;
	} 

	return false;
}


// Setup and display the Google Map
// http://www.geocodezip.com/v3_polygon_example_donut.html
var map = null;
var bounds = null;
function showMap(position) {
	consoleLog("showMap(");
	consoleLog(position);

	showPosition(position, 2);
	getReps(position);


	var myOptions = {
//		zoom: 10,
//		center: new google.maps.LatLng(-33.9, 151.2) //,
//		mapTypeControl: true,
//  		mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU},
//		navigationControl: true,
//		mapTypeId: google.maps.MapTypeId.ROADMAP
  	}
	map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
  	bounds = new google.maps.LatLngBounds();

	var circle = new google.maps.Polygon({
		paths: [drawCircle(new google.maps.LatLng(position.coords.latitude, position.coords.longitude), position.coords.accuracy / 1000, 1)],
		strokeColor: "#FFFFFF",
		strokeOpacity: 1.0,
		strokeWeight: 1,
		fillColor: "#FF0000",
		fillOpacity: 0.35 //,
//		zoom: 3
	});
	circle.setMap(map);

	map.fitBounds(bounds);
	return false;
}

//37.804964399999996, -122.4349546


// Setup and request the representatives
// https://developers.google.com/civic-information/docs/using_api
function getReps(position) {
	consoleLog("getReps(");
	consoleLog(position);

	var theURL = "https://www.googleapis.com/civicinfo/v2/representatives?" + 
		"key=AIzaSyDn6XiONTTiBm7HPFiC4irVqlGRGW3PiRA&" +
		"address=" + position.coords.latitude + "," + position.coords.longitude;

	$.getJSON(theURL, function(data) {
		console.log(data);

		// Grab the zip
		if (data.normalizedInput.zip)
			$("#location").append("<p>Your ZIP: " + data.normalizedInput.zip + "</p>\n");

		var theReps = $("#representatives").append("<ul />");

		// TODO:  Sort the output
		$.each(data.divisions, function(divKey, divValue) {
			var thisDivision = $("<li id='" + divKey + "'>" + divValue.name + "</li>");
			theReps.children("ul").append(thisDivision);

			if (divValue.officeIndices.length > 0) {
				var thisOffice = $("<ul />");

				$.each(divValue.officeIndices, function(officeKey, officeValue) {


					$.each(data.offices[officeValue].officialIndices, function(officialKey, officialValue) {
						thisOffice.append("<li id='" + officeValue.divisionid + "/office:" + officeKey + "/official:" + officialKey + "'><strong>" + data.offices[officeValue].name + "</strong>: " + data.officials[officialValue].name + "</li>");
					});

					thisDivision.append(thisOffice);
				});
			}
		});

	});
	return false;
}
