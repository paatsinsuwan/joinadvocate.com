
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
function initialize(theLocation) {
	consoleLog("initialize(");
	consoleLog(theLocation);
	
	if (!theLocation)
		navigator.geolocation.getCurrentPosition(function(location) {
			getReps(location);
			showPosition(location, 2);
			return false;
		}, showError);
	else {
		getReps(theLocation)
		showPosition(theLocation, 2);
	}

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

		// Select a rep at random
		var repIndex = Math.floor((Math.random() * data.officials.length));

		// Print out the reps
		var theReps = $("#representatives").append("<p>One of your representatives (#" + repIndex + "), selected at random:</p>");
		var theRep = data.officials[repIndex];

		theReps.append("<address class=\"vcard\">" + 
							"<h1 class=\"p-name\">" + theRep.name + "</h1>" + 
						"</address>");

		// Find the office
		var theOffice = -1;
		$.each(data.offices, function(id, office) {
			if (office.officialIndices.indexOf(repIndex) >= 0)
				theOffice = id;
		});
		if (theOffice >= 0)
			$("address", theReps).append("<p class=\"p-role\">" + data.offices[theOffice].name + "</p>");

		// Find the party affiliation
		if (theRep.party && (theRep.party != "Nonpartisan")) {
			$(".p-role", theReps).append(" (" + theRep.party.charAt(0) + ")");
		}

		// Find the division
		var theDivision = -1;
		$.each(data.divisions, function(id, division) {
			if (division.officeIndices.indexOf(theOffice) >= 0)
				theDivision = id;
		});
		if (theDivision != -1)
			$("address", theReps).append("<p class=\"p-org\">" + data.divisions[theDivision].name + "</p>");

		// Print addresses
		$.each(theRep.address, function(id, address) {
			$("address", theReps).append("<p class=\"h-adr\">" +
											((address.locationName != null) ? "<span class=\"p-name\">" + address.locationName + "</span>" : "") +
											((address.line1 != null) ? "<span class=\"p-street-address\">" + address.line1 + "</span>" : "") +
											((address.line2 != null) ? "<span class=\"p-extended-address\">" + address.line2 + "</span>" : "") +
											((address.line3 != null) ? "<span class=\"p-extended-address\">" + address.line3 + "</span>" : "") +
											((address.city != null) ? "<span class=\"p-locality\">" + address.city + "</span>" : "") +
											((address.state != null) ? "<span class=\"p-region\">" + address.state + "</span>" : "") +
											((address.zip != null) ? "<span class=\"p-postal-code\">" + address.zip + "</span>" : "") +
										"</p>");
		});

		// Some officials might have a photo
		if (theRep.photoUrl) {
			$("address", theReps).prepend("<img class=\"u-photo\" src=\"" + theRep.photoUrl + "\" alt=\"Photo of " + theRep.name + "\" />");
		}

		var channelLinks = $("address").append("<ul class=\"channels\"></ul>");

		// Print out each phone number
		$.each(theRep.phones, function(id, phone) {
			channelLinks.append("<li><a class=\"p-tel fa fa-phone-square\" href=\"tel:" + phone.replace(/\D/g,'') + "\">" + phone + "</a></li>");
		});

		// Print out each URL
		$.each(theRep.urls, function(id, url) {
			channelLinks.append("<li><a class=\"u-url fa fa-link\" href=\"" + url + "\">" + url + "</a></li>");
		});

		// Print out each social media channel
		$.each(theRep.channels, function(id, channel) {
			channel.urlPrefix = new function(handle) {
				return "" + handle;
			};
			channel.faLogoClass = "fa fa-comment";
			channel.title = "Other Channel";

			switch(channel.type) {
				case "GooglePlus":
					channel.urlPrefix = function(handle) {
						return "https://plus.google.com/" + handle.replace(/\+/g, '');
					},
					channel.faLogoClass = "fa fa-google-plus-square";
					channel.title = "Google+";
					break;
				case "Facebook":
					channel.urlPrefix = function(handle) {
						return "https://www.facebook.com/" + handle;
					},
					channel.faLogoClass = "fa fa-facebook-official";
					channel.title = "Facebook";
					break;
				case "Twitter":
					channel.urlPrefix = function(handle) {
						return "https://www.twitter.com/" + handle.replace(/\@/g, '');
					},
					channel.faLogoClass = "fa fa-twitter-square";
					channel.title = "Twitter";
					break;
				case "Instagram":
					channel.urlPrefix = function(handle) {
						return "https://www.instagram.com/" + handle;
					},
					channel.faLogoClass = "fa fa-instagram";
					channel.title = "Instagram";
					break;
				case "YouTube":
					channel.urlPrefix = function(handle) {
						return "https://www.youtube.com/user/" + handle;
					},
					channel.faLogoClass = "fa fa-youtube-square";
					channel.title = "YouTube";
					break;
				case "LinkedIn":
					channel.urlPrefix = function(handle) {
						return "https://www.linkedin.com/in/" + handle;
					},
					channel.faLogoClass = "fa fa-linkedin-square";
					channel.title = "LinkedIn";
					break;
				default:
					break;
			}
			channelLinks.append("<li><a class=\"u-url " + channel.faLogoClass + "\" href=\"" + channel.urlPrefix(channel.id) + "\">" + channel.id + "</a></li>");
		});

		

	});
	return false;
}
