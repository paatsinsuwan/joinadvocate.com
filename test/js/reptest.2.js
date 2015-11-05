
// Debugging function
var debug = false;

debug = true;

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
function initialize(theLocation) {
	consoleLog("initialize(");
	consoleLog(theLocation);
	
	if (!theLocation)
		navigator.geolocation.getCurrentPosition(showMap, showError);
	else
		showMap(theLocation)

	return false;
}

// HTML5 geolocation error function 
function showError(error) {
	consoleLog("showError(");
	consoleLog(error);

	alert(error);
	return false;
}


// Output info about the current position
function showPosition(position, style) {
	consoleLog("showPosition(");
	consoleLog(position);
	consoleLog(style);

	// Check for HTML5 geocode, which arrive as an object
	if (typeof position !== "object")
		style = 0;

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
			x.innerHTML +=
				"<p>You entered: " + position + "</p>\n";
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

	// Check for HTML5 geocode, which arrives as an object
	if (typeof position === "object") {

		// Create the map with default values
		var map = new google.maps.Map(document.getElementById("map_canvas"), {
			disableDefaultUI: true,
			draggable: false,
			scrollwheel: false
		});

		// Draw the circle of uncertainty
		var circle = new google.maps.Circle({
			strokeColor: '#FF0000',
			strokeOpacity: 0.8,
			strokeWeight: 2,
			fillColor: '#FF0000',
			fillOpacity: 0.35,
			map: map,
			center: {lat: position.coords.latitude, lng: position.coords.longitude},
			radius: position.coords.accuracy
		});

		// Scale and reposition the map appropriately
		bounds = new google.maps.LatLngBounds();
		bounds.extend(new google.maps.LatLng(position.coords.latitude + (position.coords.accuracy / 111000), position.coords.longitude));
		bounds.extend(new google.maps.LatLng(position.coords.latitude - (position.coords.accuracy / 111000), position.coords.longitude));
		map.fitBounds(bounds);

	} else {

		// Get the geocode from the plain-text position entry
		var geocoder = new google.maps.Geocoder();
		geocoder.geocode({"address": position}, function(results, status) {

			// Doublecheck the return value
			if (status == google.maps.GeocoderStatus.OK) {
				consoleLog("results[0].geometry.location = ");
				consoleLog(results[0].geometry.location);

				// Setup the map
				var map = new google.maps.Map(document.getElementById("map_canvas"), {
					disableDefaultUI: true,
					draggable: false,
					scrollwheel: false
				});

				// Scale and reposition the map appropriately
				map.setCenter(results[0].geometry.location);
				map.fitBounds(results[0].geometry.viewport);

				// Draw the point
				var marker = new google.maps.Marker({
					position: results[0].geometry.location,
					map: map
				});

			} else {
				alert("Geocode was not successful for the following reason: " + status);
			}
		});

		consoleLog("skipping map for now (position = \"" + position + "\"\n");
	}

	return false;
}

// Example lat, lon
//37.804964399999996, -122.4349546


// Setup and request the representatives
// https://developers.google.com/civic-information/docs/using_api
function getReps(position) {
	consoleLog("getReps(");
	consoleLog(position);

	// Check for HTML5 geocode, which arrives as an object
	var theURL = "https://www.googleapis.com/civicinfo/v2/representatives?" + 
		"key=AIzaSyDn6XiONTTiBm7HPFiC4irVqlGRGW3PiRA&" +
		"address=" + ((typeof position === "object") ? (position.coords.latitude + "," + position.coords.longitude) : position);

	$.getJSON(theURL, function(data) {
		consoleLog(data);

		// Grab the zip
		if (data.normalizedInput.zip)
			$("#location").append("<p>Your ZIP: " + data.normalizedInput.zip + "</p>\n");

		// Sort the data
		var sortedDivisions = Object.keys(data.divisions).sort();
		consoleLog(sortedDivisions);

		// Grab the reps
		var repData = {};
		for (var divKey in sortedDivisions) {
			var divValue = data.divisions[sortedDivisions[divKey]];

			consoleLog("divValue = ");
			consoleLog(divValue);

			if (typeof divValue.officeIndices != "undefined") {
				repData[divValue.name] = {};

				$.each(divValue.officeIndices, function(officeKey, officeValue) {
//					consoleLog("officeKey = " + officeKey);
//					consoleLog("officeValue = " + officeValue);
//					consoleLog(data.offices[officeValue].officialIndices);

					if (typeof data.offices[officeValue].officialIndices == "undefined") {
						// The office is vacant
//						consoleLog("office is vacant");
						repData[divValue.name][data.offices[officeValue].name] = "";
					} else
						$.each(data.offices[officeValue].officialIndices, function(officialKey, officialValue) {
//							consoleLog("officialValue = " + officialValue);
							repData[divValue.name][data.offices[officeValue].name] = data.officials[officialValue].name;
						});
				});
			}
		}

		// Print out the reps
		var theReps = $("#representatives").append("<p>Your Representatives:</p><ul />");

		consoleLog(repData);
		$.each(repData, function(division, offices) {
			var thisDivision = $("<li>" + division + "<ul /></li>");

			$.each(offices, function(office, official) {
				thisDivision.children("ul").append("<li><strong>" + office + ":</strong> " + official + "</li>");
			});

			theReps.children("ul").append(thisDivision);

		});

	});
	return false;
}
