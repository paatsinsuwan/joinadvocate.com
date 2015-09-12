
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

	var apiKey = "AIzaSyDn6XiONTTiBm7HPFiC4irVqlGRGW3PiRA";

	// Check for HTML5 geocode, which arrives as an object
	var theURL = "https://www.googleapis.com/civicinfo/v2/representatives?" + 
		"key=" + apiKey + "&" +
		"address=" + ((typeof position === "object") ? (position.coords.latitude + "," + position.coords.longitude) : position);

	// Now query for the reps
	$.getJSON(theURL, function(data) {
		consoleLog(data);

/*
		// Select a rep at random
		var repIndex = Math.floor((Math.random() * data.officials.length));

		// Print out the reps
		var theReps = $("#representatives").append("<p>One of your representatives (#" + repIndex + "), selected at random:</p>");
*/

		// Select only US Senators
		var senatorIndices = [];
		var theOCD_ID = "";
		$.each(data.offices, function(id, office) {
			if (((typeof office.levels != "undefined") && (office.levels.indexOf("country") > -1)) && ((typeof office.roles != "undefined") && (office.roles.indexOf("legislatorUpperBody") > -1))) {
				theOCD_ID = office.divisionId;
				$.each(office.officialIndices, function(i, oi) {
					senatorIndices.push(oi);
				});
			}
		});

		$("#representatives").append("<h1>In " + data.divisions[theOCD_ID].name + ", your US Senators are:</h1>");

		// Get data from Sunlight
		getSunlightReps(theOCD_ID, data, senatorIndices, function(theOCD_ID, data, senatorIndices) {

			// Display each of them
			$.each(senatorIndices, function(id, repIndex) {
				printRep(repIndex, data, "#representatives");
			});
		});

	});
	return false;
}

// Grab US Congress info from Sunlight based on the OCD ID returned from Civic Data API
function getSunlightReps(ocd_id, theData, theIndices, successFunction) {
	consoleLog("getSunlightReps(");
	consoleLog(ocd_id);
	consoleLog(theData);
	consoleLog(theIndices);

	var apiKey = "f36efc0ec23f4719b097ff89b48cf1ea";

/*
	// Check for HTML5 geocode, which arrives as an object
	if ((typeof position !== "object") && (!$.isNumeric(position)) 
		alert("Sorry, the Sunlight API can only accept a (lat,lon) or zip code for location.");
	else {
*/
	// Now query for the reps
	var theURL = "https://congress.api.sunlightfoundation.com/legislators?" + 
		"apikey=" + apiKey + "&" +
		"per_page=all&" + 
		"ocd_id=" + ocd_id;
	$.getJSON(theURL, function(data) {
		consoleLog("Sunlight Congress data success!");
		consoleLog(data);

		// Iterate through the reps
		$.each(data.results, function(i, rep) {
			consoleLog("finding rep #" + i);
			consoleLog("Sunlight Name = \"" + rep.first_name + " " + rep.last_name + "\"");

			// See if we can grab their most recent vote
			var theURL = "https://congress.api.sunlightfoundation.com/votes?" + 
				"apikey=" + apiKey + "&" +
				"fields=question,voted_at,bill,result,url,breakdown,required,voters." + rep.bioguide_id + "&" +
				"order=voted_at&" +
				"per_page=1&" +
				"voter_ids." + rep.bioguide_id + "__exists=true"
			$.getJSON(theURL, function(data) {
				consoleLog("Sunlight Votes data success!");
				consoleLog(data);

				rep.latestVote = data.results[0];

			}).fail(function() {
				consoleLog("Sunlight Votes data error!");
			}).always(function() {

				// Match this rep up with the existing data
//				var thisRepID = -1;
				$.each(theIndices, function(i, v) {
					if (theData.officials[v].name == rep.first_name + " " + rep.last_name) {
//						thisRepID = v;
						consoleLog("found! at #" + v);
						consoleLog(theData.officials[v]);
						$.extend(theData.officials[v], rep);

						// Then run the callback for this rep only
						successFunction(ocd_id, theData, [v]);

					}
				});
			});

		});

	}).fail(function() {
		consoleLog("Sunlight Congress data error!");
	});
//	}

};



// Print out information about a rep
function printRep(repIndex, data, theSelector) {
	consoleLog("printRep(");
	consoleLog(repIndex);
	consoleLog(data);
	consoleLog(theSelector);
	consoleLog(") {");

	var theRep = data.officials[repIndex];
	var theReps = $("<address class=\"vcard\" id=\"rep" + repIndex + "\">" + 
						"<h1 class=\"p-name\">" + theRep.name + "</h1>" + 
					"</address>");

	// Find the office
	var theOffice = -1;
	$.each(data.offices, function(id, office) {
		if (office.officialIndices.indexOf(repIndex) >= 0)
			theOffice = id;
	});
	if (theOffice >= 0)
		theReps.append("<p class=\"p-role\">" + data.offices[theOffice].name + "</p>");

	// Find the party affiliation
	if (theRep.party && (theRep.party != "Nonpartisan")) {
		theReps.find(".p-role").append(" (" + theRep.party.charAt(0) + ")");
	}

	// Find the division, enhance with seniority for US senators
	var theDivision = -1;
	$.each(data.divisions, function(id, division) {
		if (division.officeIndices.indexOf(theOffice) >= 0)
			theDivision = id;
	});
	if (theDivision != -1) {
		if (typeof theRep.state_rank != "undefined")
			theReps.append("<p class=\"p-org\">The " + theRep.state_rank + " senator from " + data.divisions[theDivision].name + "</p>");
		else
			theReps.append("<p class=\"p-org\">" + data.divisions[theDivision].name + "</p>");
	}

	// Print addresses
	$.each(theRep.address, function(id, address) {
		theReps.append("<p class=\"h-adr\">" +
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
		theReps.prepend("<img class=\"u-photo\" src=\"" + theRep.photoUrl + "\" alt=\"Photo of " + theRep.name + "\" style=\"width:200px\"/>");
	}

	var channelLinks = theReps.append("<ul class=\"channels\"></ul>");

	// Print out each phone number
	$.each(theRep.phones, function(id, phone) {
		channelLinks.append("<li><a class=\"p-tel fa fa-phone-square\" href=\"tel:" + phone.replace(/\D/g,'') + "\">" + phone + "</a></li>");
	});

	// Print out Email addresses (including those enhanced from Sunlight)
	if (typeof theRep.email != "undefined")
		channelLinks.append("<li><a class=\"u-email fa fa-envelope\" href=\"mailto:" + theRep.email + "\">" + theRep.email + "</a></li>");
	if (typeof theRep.oc_email != "undefined")
		channelLinks.append("<li><a class=\"u-email fa fa-envelope\" href=\"mailto:" + theRep.oc_email + "\">" + theRep.oc_email + "</a></li>");

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
					return "https://plus.google.com/" + handle;
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
					return "https://www.youtube.com/" + handle;
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

	// If this rep has a most recent vote, show it
	if (typeof theRep.latestVote != "undefined") {
		consoleLog("found a latest vote");

		var theVote = $("<div class=\"vote\"><h3>Latest vote:</h3></div>");
		theVote.append("<p><a href=\"" + theRep.latestVote.url + "\" target=\"_blank\">" + theRep.latestVote.question + "</a> at " + theRep.latestVote.voted_at + "<br>" +
						"The <strong>" + theRep.latestVote.result + "</strong> by a vote of " + theRep.latestVote.breakdown.total.Yea + " voting Yea and " + theRep.latestVote.breakdown.total.Nay + " voting Nay.  (More than " + theRep.latestVote.required + " was required to pass.)<br>" + 
						theRep.title + " " + theRep.last_name + " voted <strong>" + theRep.latestVote.voters[theRep.bioguide_id].vote + "</strong>, as did " + theRep.latestVote.breakdown.party[theRep.party][theRep.latestVote.voters[theRep.bioguide_id].vote] + " other member" + ((theRep.latestVote.breakdown.party[theRep.party][theRep.latestVote.voters[theRep.bioguide_id].vote] != 1) ? "s" : "") + " of " + ((theRep.gender == "M") ? "his" : "her") + " party.</p>");
		theVote.appendTo(theReps);
	}


	// Add this rep to the DOM
	theReps.appendTo(theSelector);
}



