/*--------------------------------------------------

Advocate - CAT
CAT Object Definitions [advocate-cat-obj.js]

Joe Morrow <joe@joinadvocate.com>
9/24/2015

Copyright @ 2015 by Advocate

--------------------------------------------------*/

/*
	Cookies

location.lat
location.lon
UID
hasRegistered

	DB

User
- Name
- Email
- Location
	- lat
	- lon
	- city
	- state
	- zip
- Interests [candidate,incumbent,citizen,campaign]
- Timestamp
- UID

Representative
- Name
- Office
- OCD ID
- Bioguide ID
- Email
- Actions
	- list
	- detail
	- share
	- favorite
	- invite
	- vote
- Connect
	- web
	- email
	- phone
	- twitter
	- facebook
	- linkedin
	- youtube
	- instagram
	- google+
- Timestamp
- UID

Comment
- Name
- Email
- Location
	- lat
	- lon
	- city
	- state
	- zip
- Interests [candidate,incumbent,citizen,campaign]
- Comment
- Timestamp
- UID
*/


// Add console.log for browsers that don't contain it
// http://stackoverflow.com/questions/3767924/js-override-console-log-if-not-defined
if (typeof console == "undefined") {
    window.console = {
        log: function() {},
		debug: function() {},
		debugLevel: false
    };
}

// Add debugging when necessary, set globally
window.console.debugLevel = false;
window.console.debug = function(msg, level) {
	if (window.console.debugLevel) {
		if (typeof level == "undefined")
			level = 1;
		if (window.console.debugLevel >= level)
			window.console.log(msg);
	}
}

// Get a JSON object of URL query parameters
// https://css-tricks.com/snippets/jquery/get-query-params-object/
function parseURL(theURL) {
	console.debug("parseURL(" + theURL + ")");
	var results = (theURL || document.location.search).replace(/(^\?)/,'').split("&").map(function(n) {return n = n.split("="), this[n[0]] = (decodeURIComponent(n[1]) == "undefined") ? "" : decodeURIComponent(n[1]), this}.bind({}))[0];

	// Just return empty string instead of undefined
	if (!Object.keys(results)[0])
		results = {};

	console.debug(results);
	return results;
}


//	Page Object
function Page(theLocationFieldID, theLocationHiddenID, theLocationDoUpdateCookie, theModalObjs, theModalFormObjs, theMapID, theRepListID, theRepDetailsID, theVoteID) {
	console.debug("new Page(" + theLocationFieldID + ", " + theLocationHiddenID + ", " + theLocationDoUpdateCookie + ", [" + theModalObjs + "], [" + theModalFormObjs + "], " + theMapID + ", " + theRepListID + ", " + theRepDetailsID + ", " + theVoteID + ") {");

	this.ngScope = null;
	this.userEmail = this.getUserEmailCookie();
	this.params = parseURL();

	// If initializing as Page(), we're just getting a handle to run Page methods, so don't run the full init
	if (arguments.length > 0) {
		if ((typeof theLocationFieldID != "undefined") && (typeof theLocationHiddenID != "undefined")) {
			this.location = new Location(theLocationFieldID, theLocationHiddenID, null, theLocationDoUpdateCookie, this);
		}
		this.modals = new Array();
		if (typeof theModalObjs != "undefined")
			for (i in theModalObjs)
				this.modals.push(new Modal(theModalObjs[i], this));
		if (typeof theModalFormObjs != "undefined")
			for (i in theModalFormObjs)
				this.modals.push(new ModalForm(theModalFormObjs[i], this));
		this.tracker = new Tracker(window.location.href);
		this.map = ((typeof theMapID != "undefined") && theMapID) ? new Map(theMapID, this.location) : null;
		this.repList = ((typeof theRepListID != "undefined") && theRepListID) ? new RepList(theRepListID, this.location, this) : null;
		this.repDetails = ((typeof theRepDetailsID != "undefined") && theRepDetailsID) ? new RepDetails(theRepDetailsID, theVoteID, null, null, null, null, this) : null;

		// Set up event handlers for common on-page actions
		$("body").on("change", "input.all[type='checkbox']", function() {
			$(this).parents("fieldset").find("input[type='checkbox']").prop("checked", $(this).prop("checked"));
		});
		$("body").on("change", "input[type='checkbox']:not(.all)", function() {
			$(this).parents("fieldset").find("input.all[type='checkbox']").prop("checked", ($(this).parents("fieldset").find("input[type='checkbox']:checked:not(.all)").length == $(this).parents("fieldset").find("input[type='checkbox']:not(.all)").length));
		});
		$("body").on("click", "a.disabled", function() {
			return false;
		});

		// Turn on tooltips in the newly loaded content
		$('.tooltip').tooltipster({
			offsetX: 5,
			position: "bottom-left"
		});

		// Check for debugging params
		if (typeof this.params.debugEmail != "undefined")
			this.userEmail = (!this.params.debugEmail || (this.params.debugEmail == "false")) ? false : this.params.debugEmail;

		if (typeof this.params.debugLevel != "undefined")
			window.console.debugLevel = (!this.params.debugLevel || (this.params.debugEmail == "false")) ? false : this.params.debugLevel;

	} else
		console.debug("initializing empty Page object");

	console.debug("debug level = " + window.console.debugLevel);
}
// Page Methods
Page.prototype.startLoading = function(msg) {
	console.debug("Page.startLoading(" + msg + ")");
	$("body").addClass("loading").append("<div id=\"loading\"><div class=\"overlay\"><p>" + msg + "</p></div></div>");
};
Page.prototype.stopLoading = function() {
	console.debug("Page.stopLoading()");
	$("body.loading").removeClass("loading");
	$("#loading").remove();
};
Page.prototype.getNgScope = function() {
	console.debug("Page.getNgScope()");
	console.debug(this.ngScope);
	return ((typeof this.ngScope != "undefined") && this.ngScope) ? this.ngScope : false;
};
Page.prototype.setNgScope = function(theNgScope) {
	console.debug("Page.setNgScope(");
	console.debug(theNgScope);
	if (typeof theNgScope != "undefined")
		this.ngScope = theNgScope;
};
Page.prototype.getUserEmail = function() {
	console.debug("Page.getUserEmail() {");
	console.debug(this.userEmail);
	return (typeof this.userEmail != "undefined") ? this.userEmail : false;
};
Page.prototype.setUserEmail = function(theUserEmail) {
	console.debug("Page.setUserEmail('" + theUserEmail + "')");
	if (typeof theUserEmail != "undefined") {
		this.userEmail = theUserEmail;
		return true;
	} else
		return false;
};	
Page.prototype.getUserEmailCookie = function() {
	console.debug("Page.getUserEmailCookie() {");
	// http://www.w3schools.com/js/js_cookies.asp

// TODO:  Handle disabled cookies, try HTML5 local storage

	var theUserEmail = "";

	console.debug("document.cookie = ", 2);
	console.debug(document.cookie, 2);

	var ca = document.cookie.split(';');
	for (var i=0; i<ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ')
			c = c.substring(1);

		// Look for the "userEmail" cookie, and parse out the value as string
		if (c.indexOf("userEmail=") == 0) {
			var cookieVal = c.substring(10, c.length);
			console.debug("found cookie: ", 2);
			console.debug(cookieVal, 2);

			theUserEmail = decodeURIComponent(cookieVal);
			console.debug("theUserEmail = ", 2);
			console.debug(theUserEmail, 2);
		}
	}
/*
	// Make sure we have a valid location, in case the cookie is busted
	if (!this.isValid(theLocation))
		theLocation = this.getNew();

	console.debug("theLocation = ");
	console.debug(theLocation);
*/
	this.setUserEmail(theUserEmail);

//	console.debug("isValid() = ", 2);
//	console.debug(this.isValid(), 2);
//	return this.isValid();

	return (typeof this.userEmail != "undefined") ? this.userEmail : false;
};	
Page.prototype.setUserEmailCookie = function(theUserEmail) {
	console.debug("Page.setUserEmailCookie(" + theUserEmail + ") {");
	// http://www.w3schools.com/js/js_cookies.asp

	if (typeof theUserEmail != "undefined")
		this.setUserEmail(theUserEmail);
	else
		theUserEmail = this.getUserEmail();

	var cookieVal = encodeURIComponent(theUserEmail)

// TODO:  Handle disabled cookies, try fallback to HTML5 local storage

	// Expire the location one year from today
	var exdays = 365;
	var d = new Date();
	d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
	var expires = "expires=" + d.toUTCString();

	document.cookie = "userEmail=" + cookieVal + "; " + expires;

	console.debug("document.cookie = ");
	console.debug(document.cookie);
};
Page.prototype.isUserRegistered = function() {
	console.debug("Page.isUserRegistered() {");
	
	var theUserEmail = this.userEmail;	
	console.debug("theUserEmail = '" + theUserEmail + "'", 2);

	if ((theUserEmail !== false) && ((typeof theUserEmail == "undefined") || (theUserEmail.length <= 0)))
		theUserEmail = this.getUserEmailCookie();

	var isRegistered = ((typeof theUserEmail != "undefined") && (theUserEmail.length > 0)) ? true : false;
	console.debug("isRegistered = " + isRegistered);
	return isRegistered;
};	


// Location Object
function Location(theFieldID, theHiddenID, theLocation, doUpdateCookie, thePage) {
	console.debug("new Location(" + theFieldID + ", " + theHiddenID + ", " + theLocation + ", " + doUpdateCookie + ", " + thePage + ") {");

	this.field = (typeof theFieldID != "undefined") ? $(theFieldID) : null;
	this.hidden = (typeof theHiddenID != "undefined") ? $(theHiddenID) : null;
	this.form = (this.field != null) ? this.field.parents("form") : null;
	this.location = ((typeof theLocation != "undefined") && theLocation) ? theLocation : this.getNew();

	console.debug("*** this.location = ");
	console.debug(this.location);

	// Note that we're using doUpdateCookie to also indicate that the form shouldn't be submitted, which is the case for join and contact forms.
	this.doUpdateCookie = (typeof doUpdateCookie != "undefined") ? doUpdateCookie : true;
	this.valid = this.setFromCookie();
	this.target = "results.html";
	this.page = (thePage instanceof Page) ? thePage : new Page();

	if (!this.isValid())
		this.location = this.getNew(true);

	this.geocode();
	this.updateFields();

	// Set up form elements
	$("button.current", this.form).click(this, this.handleUseCurrentLocation);
	this.form.submit(this, this.handleSubmit);
}
// Location Methods
/*
Location.prototype.getDefault = function() {
	console.debug("Location.getDefault()");

	// Default location is The White House

	console.debug(theLocation);
	return theLocation;
};
*/
Location.prototype.getNew = function(useDefault) {
	console.debug("Location.getNew(" + useDefault + ")");

	var theLocation = null;

	if ((typeof useDefault != "undefined") && useDefault)
		theLocation = {
			geo: {
				lat: 38.8976763,
				lon: -77.03652979999998
			},
			accuracy: 100,
			text: "The White House, 1600 Pennsylvania Ave NW, Washington, DC 20500, USA",
			city: "Washington",
			state: "DC",
			zip: 20500,
			country: "United States",
			isGeocoded: true,
			isCurrent: false,
			isDefault: true
		};
	else
		theLocation = {
			geo: {lat: null, lon: null},
			accuracy: null,
			text: null,
			isGeocoded: false,
			isCurrent: false,
			isDefault: false
		};

	console.debug(theLocation);
	return theLocation;
};
Location.prototype.isValid = function(theLocation) {
	console.debug("Location.isValid()");
	console.debug(theLocation);

	var loc = null;
	var valid = false;

	// Evaluate a passed location attribute instead of this.location
	if (typeof theLocation != "undefined")
		loc = theLocation;
	else {
		loc = this.location;
		valid = this.valid;
	}

	// Assuming we have a valid location object, valid situations are:
	// 1. location.text exists, but hasn't yet been evaluated
	// 2. A zipcode exists
	// 3. Both a city and state exist
	// 4. Both a (lat, lon) geocode and accuracy exist
	// (note that we're checking for existance, not actual validity or mutual exclusivity, so we could, for example, be in the middle of the ocean)
	if (typeof loc != "undefined") {
		if (((typeof loc.text != "undefined") && loc.text) && ((typeof loc.isGeocoded != "undefined") && !loc.isGeocoded)) {
			valid = true;
		} else if ((typeof loc.zip != "undefined") && $.isNumeric(loc.zip)) {
			valid = true;
		} else if (((typeof loc.city != "undefined") && loc.city) && ((typeof loc.state != "undefined") && loc.state)) {
			valid = true;
		} else if ((typeof loc.geo != "undefined") && ((typeof loc.geo.lat != "undefined") && $.isNumeric(loc.geo.lat)) && ((typeof loc.geo.lon != "undefined") && $.isNumeric(loc.geo.lon))  && ((typeof loc.accuracy != "undefined") && $.isNumeric(loc.accuracy))) {
			valid = true;
		}
	}

	console.debug("the location is ", 2);
	console.debug(valid, 2);
	this.valid = valid;

	return this.valid;
};
Location.prototype.isDefault = function(theLocation) {
	console.debug("Location.isDefault(");
	console.debug(theLocation);

	// Evaluate a passed location attribute instead of this.location
	var loc = (typeof theLocation != "undefined") ? theLocation : this.location;
	var isDefault = ((typeof loc.isDefault == "undefined") || !loc.isDefault) ? false : true;

	console.debug(isDefault);
	return isDefault;
};
Location.prototype.getLocation = function() {
	console.debug("Location.getLocation()");
	console.debug(this.location);
	return this.location;
};
Location.prototype.getLocationGeo = function() {
	console.debug("Location.getLocationGeo()");
	console.debug(this.location.geo);
	return (typeof this.location.geo != "undefined") ? this.location.geo : {lat: false, lon: false};
};
Location.prototype.getLocationAccuracy = function() {
	console.debug("Location.getLocationAccuracy()");
	console.debug(this.location.accuracy);
	return (typeof this.location.accuracy != "undefined") ? this.location.accuracy : false;
};
Location.prototype.getLocationText = function() {
	console.debug("Location.getLocationText()");
	console.debug(this.location.text);
	return (typeof this.location.text != "undefined") ? this.location.text : false;
};
Location.prototype.getLocationIsGeocoded = function() {
	console.debug("Location.getLocationIsGeocoded()");
	console.debug(this.location.isGeocoded);
	return (typeof this.location.isGeocoded != "undefined") ? this.location.isGeocoded : false;
};
Location.prototype.getLocationIsCurrent = function() {
	console.debug("Location.getLocationIsCurrent()");
	console.debug(this.location.isCurrent);
	return (typeof this.location.isCurrent != "undefined") ? this.location.isCurrent : false;
};
Location.prototype.getLocationCity = function() {
	console.debug("Location.getLocationCity()");
	console.debug(this.location.city);
	return (typeof this.location.city != "undefined") ? this.location.city : false;
};
Location.prototype.getLocationState = function() {
	console.debug("Location.getLocationState()");
	console.debug(this.location.state);
	return (typeof this.location.state != "undefined") ? this.location.state : false;
};
Location.prototype.getLocationZip = function() {
	console.debug("Location.getLocationZip()");
	console.debug(this.location.zip);
	return (typeof this.location.zip != "undefined") ? this.location.zip : false;
};
Location.prototype.getLocationCountry = function() {
	console.debug("Location.getLocationCountry()");
	console.debug(this.location.country);
	return (typeof this.location.country != "undefined") ? this.location.country : false;
};
Location.prototype.isCountryValid = function(theCountry) {
	console.debug("Location.isCountryValid(" + theCountry + ")");
	console.debug(this.location.country);

	// This is the list of valid countries
	var validCountries = ["United States"];

	var results = true;

 	if ((typeof theCountry == "undefined") || !theCountry)
		theCountry = this.location.country;

 	if ((typeof theCountry != "undefined") && theCountry)
		results = (validCountries.indexOf(theCountry) >= 0) ? true : false;

	console.debug(results);
	return results;
};
Location.prototype.getField = function() {
	console.debug("Location.getField()");
	console.debug(this.field);
	return this.field;
};
Location.prototype.getHidden = function() {
	console.debug("Location.getHidden()");
	console.debug(this.hidden);
	return this.hidden;
};
Location.prototype.geocode = function(theGeoResults, isRecursive) {
	console.debug("Location.geocode(");
	console.debug(theGeoResults);
	console.debug(isRecursive);

	isRecursive = (typeof isRecursive == "undefined") ? false : isRecursive;
	var geoResults = false;
	var newLocation = this.getNew();
	var isUpdated = false;

	// If we didn't get a valid geocode results object, query Google to get one, then recursively rerun this function
	if ((typeof theGeoResults == "undefined") || (typeof theGeoResults[0].address_components == "undefined")) {

		console.debug("no valid geocode results received", 2);

		// If the location has already been geocoded, don't do it again.
		if (!this.getLocationIsGeocoded()) {
			console.debug("isGeocoded = false", 2);

			var query = {}

			// If the user just submitted a text field that we haven't geocoded yet, try that first
			var locationText = this.getLocationText();
			if (locationText) {
				console.debug("location text exists to forward geocode", 2);
				console.debug(locationText, 2);

				query = {"address": locationText};
			} else {
				
				// Otherwise, see if we have a valid (lat,lon) and reverse geocode it
				var locationGeo = this.getLocationGeo();
				if ($.isNumeric(locationGeo.lat) && $.isNumeric(locationGeo.lon)) {
					console.debug("geo exists to reverse geocode", 2);
					console.debug(locationGeo, 2);

					query = {"location": {lat: locationGeo.lat, lng: locationGeo.lon}};
				}
			}

			// If we have a valid geocode query, submit it
			if (query) {
				console.debug("query is okay", 2);
				console.debug(query, 2);

				// Store our current scope for the callback, below
				var that = this;

				// We want to hold off on updating the fields until we run this function again with the geocode results
				isRecursive = true;

				// Get the geocode from the plain-text position entry
				var geocoder = new google.maps.Geocoder();
				geocoder.geocode(query, function(results, status) {
					console.debug("getting the geocode", 2);
					console.debug(locationText, 2);

					// Doublecheck the return value
					if (status == google.maps.GeocoderStatus.OK) {
						console.debug("Geocode okay", 2);
						console.debug(results, 2);

						// Run the geocoder function recursively with the geocoder results object
						that.geocode(results, false);
					} else {
						console.debug("Geocode error!", 2);
						console.debug(status, 2);

						// Handle error
						that.handleError(that);
					}
				});
			} else {
				console.debug("No valid location to geocode!", 2);

				// Handle error
				that.handleError(that);
			}
		} else {
			console.debug("This location has already been geocoded.", 2);
		}
	} else {
		console.debug("Handle a passed geocode object", 2);

		// Handle a passed geocode object
		geoResults = theGeoResults[0];

		// Parse the array looking for the right types of address elements
		// https://developers.google.com/maps/documentation/geocoding/intro#Types
		for (i in geoResults.address_components) {

			if (geoResults.address_components[i].types.indexOf("postal_code") >= 0) {
				newLocation.zip = geoResults.address_components[i].short_name;		// Zip code
			} else if (geoResults.address_components[i].types.indexOf("administrative_area_level_1") >= 0) {
				newLocation.state = geoResults.address_components[i].short_name;	// State
			} else if (geoResults.address_components[i].types.indexOf("locality") >= 0) {
				newLocation.city = geoResults.address_components[i].long_name;		// City
			} else if (geoResults.address_components[i].types.indexOf("country") >= 0) {
				newLocation.country = geoResults.address_components[i].long_name;	// Country
			}
		}

		if (!this.getLocationIsCurrent())
			newLocation.text = geoResults.formatted_address;
		else
			newLocation.isCurrent = true;
		newLocation.isGeocoded = true;
		newLocation.geo.lat = geoResults.geometry.location.lat();
		newLocation.geo.lon = geoResults.geometry.location.lng();
		newLocation.accuracy = 100;
		isUpdated = true;
	}

	// The Google Maps geocoder also runs this function as a callback.  If we're in that second recursive pass, we don't need to update everything twice
	if (!isRecursive) {
		console.debug("not recursive", 2);

		if (this.isValid(newLocation) && isUpdated) {
			console.debug("The new location is updated and valid: ", 2);
			console.debug(newLocation, 2);

			this.location = newLocation;
			this.updateFields();
			this.updateCookie();
			return true;
		} else {
			console.debug("no need to update.", 2);
			return false;
		}
	} else {
		console.debug("returning from recursive call and not updating", 2);
		return false;
	}
};
Location.prototype.updateFields = function() {
	console.debug("Location.updateFields()");
	console.debug("this = ", 2);
	console.debug(this);
	
	var fieldVal = this.field.val();
	var fieldClass = "current";
	var hiddenVal = this.hidden.val();
	var placeholder = this.field.attr("placeholder");
	var defaultPlaceholder = "Where do you live?";
	var currentPlaceholder = "Using your current location";
	var foundLocation = false;

	if (this.isValid()) {
		// If we're using a default address, we can skip everything else
		if (this.isDefault()) {
			console.debug("using the default address", 2);
			placeholder = defaultPlaceholder;
			fieldVal = "";
			foundLocation = true;

		// See if we're using the current location, or a geocoded text entry
		} else if (this.getLocationIsCurrent()) {

			// If we have a valid geocode, use it
			if ($.isNumeric(this.location.geo.lat) && $.isNumeric(this.location.geo.lon) && $.isNumeric(this.location.accuracy)) {
				console.debug("using geocode", 2);
				placeholder = currentPlaceholder;
				fieldVal = "";
				fieldClass += " entered";
				foundLocation = true;
			}

			// Then, stuff the current location object into the hidden input, so we can pass it along.
			hiddenVal = JSON.stringify(this.location);

		// Use the text value if it hasn't yet been geocoded
		} else if ((typeof this.location.text != "undefined") && this.location.text) {

			// See if it's been geocoded yet
			if ((typeof this.location.isGeocoded != "undefined") && !this.location.isGeocoded) {
				console.debug("using ungeocoded text", 2);
				placeholder = defaultPlaceholder;
				fieldVal = this.location.text;
				fieldClass += " entered";
				foundLocation = true;
			} else {
				// Otherwise, use the formatted address returned from the geocode search
				console.debug("using the formatted address", 2);
				placeholder = this.location.text;
				fieldVal = "";
				foundLocation = true;
			}

			// Then, stuff the current location object into the hidden input, so we can pass it along.
			hiddenVal = JSON.stringify(this.location);
		}
	}
	
	// If we didn't find a valid location, set up defaults
	if (!foundLocation) {
		console.debug("No valid location yet, usting location.text", 2);
		fieldVal = ((typeof this.location.text != "undefined") && this.location.text) ? this.location.text : "";
//		placeholder = "Where do you live?";
		placeholder = defaultPlaceholder;
		hiddenVal = null;
	}

	this.field.val(fieldVal);
	this.hidden.val(hiddenVal);
	this.field.attr("placeholder", placeholder);
	this.field.attr("class", fieldClass);
	this.field.siblings("button:not(.submit, .hidden)").attr("class", fieldClass);

	// Also apply the updates to Angular
	var ngScope = this.page.getNgScope();
	if (ngScope) {
//		alert("Location.updateFields:  ngScope.$apply()");
		ngScope.$apply();
	}

// TODO:  Migrate everything into more native Angular syntax so we don't have to do this.

};
Location.prototype.setFromCookie = function() {
	// http://www.w3schools.com/js/js_cookies.asp
	console.debug("Location.setFromCookie()");

// TODO:  Handle disabled cookies, try HTML5 local storage

	var theLocation = {};

	console.debug("document.cookie = ", 2);
	console.debug(document.cookie, 2);

	var ca = document.cookie.split(';');
	for (var i=0; i<ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ')
			c = c.substring(1);

		// Look for the "location" cookie, and parse out the value as JSON
		if (c.indexOf("location=") == 0) {
			var cookieVal = decodeURIComponent(c.substring(9, c.length));
			console.debug("found cookie: ", 2);
			console.debug(cookieVal, 2);

			theLocation = JSON.parse(cookieVal);
			console.debug("theLocation = ", 2);
			console.debug(theLocation, 2);
		}
	}

	// Make sure we have a valid location, in case the cookie is busted
	if (!this.isValid(theLocation))
		theLocation = this.getNew();

	console.debug("theLocation = ");
	console.debug(theLocation);

	this.location = theLocation;

	console.debug("isValid() = ", 2);
	console.debug(this.isValid(), 2);
	return this.isValid();
};
Location.prototype.updateCookie = function(theLocation) {
	// http://www.w3schools.com/js/js_cookies.asp
	console.debug("Location.updateCookie()");
	console.debug(theLocation);

	var loc = (typeof theLocation != "undefined") ? theLocation : this.location;

	console.debug("loc = ", 2);
	console.debug(loc, 2);

	var cookieVal = encodeURIComponent(JSON.stringify(loc));

// TODO:  Handle disabled cookies, try fallback to HTML5 local storage

	// Expire the location one year from today
	var exdays = 365;
	var d = new Date();
	d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
	var expires = "expires=" + d.toUTCString();

	document.cookie = "location=" + cookieVal + "; " + expires;

	console.debug("document.cookie = ");
	console.debug(document.cookie);
};
Location.prototype.setFromBrowser = function(callback, args) {
	console.debug("Location.setFromBrowser(");
	console.debug(callback);
	console.debug(args);

	// Handle a passed context
	var that = (typeof args != "undefined") ? args : this;

	// Grab the HTML5 location
	var theLocation = that.getNew();
	var result = navigator.geolocation.getCurrentPosition(function(position) {
		console.debug("getCurrentPosition success");
		console.debug(position);

		// Update the location based on the device's position
		theLocation.geo.lat = position.coords.latitude;
		theLocation.geo.lon = position.coords.longitude;
		theLocation.accuracy = position.coords.accuracy;
		theLocation.isCurrent = true;
		theLocation.isGeocoded = false;

		that.location = theLocation;

		console.debug("that.location.geo = ", 2);
		console.debug(that.location.geo, 2);

		// Run the callback
		callback(args);

		return that.isValid();
	}, function(err) {
		// There's an error

// TODO:  Handle the error

		console.debug("error!");
		console.debug(err);

//		alert(err);

		that.handleError(that);

		return false;
	});
};
Location.prototype.handleUseCurrentLocation = function(event) {
	console.debug("Location.handleUseCurrentLocation(");
	console.debug(event);

	var that = (typeof event.data != "undefined") ? event.data : this;

	that.page.startLoading("Loading your location");

	var result = that.setFromBrowser(function(that) {
		console.debug("callback function(");
		console.debug(that);

		// Update the field values
		that.updateFields();

		// Log the current location event for GA
		if (typeof ga == "function") {
			console.debug("GA Log:  (send, event, Current Location, " + $("input.type[type='hidden']", that.form).val() + ", " + window.location.href + ")", 2);
			ga("send", "event", "Current Location", $("input.type[type='hidden']", that.form).val(), window.location.href);
		} else
			console.debug("GA Log:  Error logging Current Location click -- GA function missing.", 2);

		// Only submit the form if we're also updating the cookie

// TODO:  Add a separate form update flag

		if (that.doUpdateCookie)
			that.form.submit();
		else
			that.page.stopLoading();
	}, that);

	event.preventDefault();
};
Location.prototype.handleSubmit = function(event) {
	console.debug("Location.handleSubmit(");
	console.debug(event);

	// Handle a passed context
	var that = (typeof event.data != "undefined") ? event.data : this;

	var theLocation = that.getNew();

	// Scrub the input values
	if (that.field.val() == "Using your current location")
		that.field.val("");

	// If the user entered something in the box, use that instead of the location we already have
	if (that.field.val().trim()) {
		console.debug("that.field.val().trim() = '" + that.field.val().trim() + "'", 2);

		theLocation.text = that.field.val().trim();
		that.location = theLocation;

		// Log the location entry event for GA
		if (typeof ga == "function") {
			console.debug("GA Log:  (send, event, Location Entry, " + $("input.type[type='hidden']", that.form).val() + ", " + window.location.href + ")", 2);
			ga("send", "event", "Location Entry", $("input.type[type='hidden']", that.form).val(), window.location.href);
		} else
			console.debug("GA Log:  Error logging Location Entry click -- GA function missing.", 2);
	}

	// Update the cookie as we unload the page
	if (that.doUpdateCookie)
		that.updateCookie();

	// Log the location submission event for GA
	if (typeof ga == "function") {
		console.debug("GA Log:  (send, event, Location Submit, " + $("input.type[type='hidden']", that.form).val() + ", " + window.location.href + ")", 2);
		ga("send", "event", "Location Submit", $("input.type[type='hidden']", that.form).val(), window.location.href);
	} else
		console.debug("GA Log:  Error logging Location Entry click -- GA function missing.", 2);

	//  For debugging, uncomment these to keep the page from submitting.
/*
	that.page.stopLoading();
	event.preventDefault();
*/
};
Location.prototype.handleError = function(context) {
	console.debug("Location.handleError(");
	console.debug(context);

	// Handle a passed context
	var that = (typeof context != "undefined") ? context : this;

	var theField = $(that.getField());
	if (theField) {
		var theFieldset = $(theField).parents("fieldset").addClass("error");
		theFieldset.before("<label class=\"error visible\" for=\"" + theField.attr("id") + "\">We were not able to get your current location, please enter your address</label>");
	}

	// Turn off the loading spinner
	that.page.stopLoading();
};


// Modal Object
function Modal(theElementObj, thePage, theTitle, theContents) {
	console.debug("new Modal(");
	console.debug(theElementObj);
	console.debug(thePage);
	console.debug(theTitle);
	console.debug(theContents);

/*
	theElementObj = [
		[
			this.element, // The jQuery selector for the modal container
			this.open, // The jQuery selector for the trigger that opens the modal
			this.close, // The jQuery selector for the trigger that closes the modal (and cancels submit)
			this.title // The title of the modal
		],
		[
			..
		]
	];
*/

	this.element = null;
	this.open = null;
	this.close = null;
	this.title = (typeof theTitle != "undefined") ? theTitle : null;
	this.contents = (typeof theContents != "undefined") ? theContents : null;
	this.page = (thePage instanceof Page) ? thePage : new Page();

	// Initialize modals and click handlers
	if ((typeof theElementObj != "undefined") && (theElementObj.length >= 3)) {
		this.element = $(theElementObj[0]);
		this.open = $(theElementObj[1]);
		this.close = $(theElementObj[2]);

		// Get the title if it's passed
		if (typeof theElementObj[3] != "undefined") {
			console.debug("title = " + theElementObj[3], 2);
			this.title = theElementObj[3];
		}

		// Set up initial state
		this.element.hide().removeClass("hidden");
		this.open.data("target", theElementObj[0]);
		this.close.data("target", theElementObj[0]);

		// Set up event handlers
		$("body").on("click", theElementObj[1], this, function(event) {
			console.debug("show");
			console.debug(event);
//			alert("show");
			event.data.show(event);
			return false;
		});
		$("body").on("click", theElementObj[2], this, function(event) {
			console.debug("hide");
			console.debug(event);
//			alert("hide");
			event.data.hide(event);
			return false;
		});
//		this.open.click(this.show);
//		this.close.click(this.hide);
	}
}
// Modal Methods
Modal.prototype.getElement = function() {
	console.debug("Modal.getElement()");
	console.debug(this.element);

	return this.element;
};
Modal.prototype.getTitle = function() {
	console.debug("Modal.getTitle()");
	console.debug(this.title);

	return this.title;
};
Modal.prototype.setTitle = function(theTitle) {
	console.debug("Modal.setTitle(" + theTitle + ")");

	this.title = (typeof theTitle != "undefined") ? theTitle : null;
};
Modal.prototype.getContents = function() {
	console.debug("Modal.getContents()");
	console.debug(this.contents);

	return this.contents;
};
Modal.prototype.setContents = function(theContents) {
	console.debug("Modal.setContents(" + theContents + ")");

	this.contents = (typeof theContents != "undefined") ? theContents : null;
};
Modal.prototype.show = function(event) {
	console.debug("Modal.show(");
	console.debug(event);
	console.debug(this,2);

//	if (typeof $(context.data).

	$("body").addClass("masked");
//	$($(event.currentTarget).data("target")).show();
	$(event.data.element).show();

	// If we have a callback function registered, run it
	if (typeof event.data.showCallback == "function")
		event.data.showCallback(event);

//	event.preventDefault();
	return false;
};
Modal.prototype.hide = function(event) {
	console.debug("Modal.hide(");
	console.debug(event);
	console.debug(this,2);

//	$($(event.currentTarget).data("target")).hide();
	$(event.data.element).hide();
	$("body").removeClass("masked");

//	alert("hide");

//	event.preventDefault();
	return false;
};


// ModalForm Object
function ModalForm(theElementObj, thePage, theTitle, theForm) {
	console.debug("new ModalForm(" + theElementObj + ", " + thePage + ", " + theTitle + ", " + theForm + ") {");

	this.form = null;
	this.location = null;
	this.isInitialized = false;
	this.theElementObj = {};
	this.theTitle = (typeof theTitle != "undefined") ? theTitle : "";
	this.page = (thePage instanceof Page) ? thePage : new Page();

/*
	theElementObj = [
		[
			this.element, // The jQuery selector for the modal
			this.open, // The jQuery selector for the trigger that opens the modal
			this.close, // The jQuery selector for the trigger that closes the modal (and cancels submit)
			this.title, // The title of the modal
			this.form, // The jQuery selector of the form
			this.url // The HTML form page to load via AJAX
		],
		[
			..
		]
	];
*/

	// Ensure we're initializing with a valid input object
	if ((typeof theElementObj != "undefined") && (theElementObj.length == 6)) {

		// We have a proper init object
		this.theElementObj = theElementObj;

// TODO:  Generalize to support Join, Contact, Invite forms

		// Add the Join Advocate form to the page and initialize
		this.loadForm(this, this.initForm);

	} else {
		console.debug("bad theElementObj");

// TODO:  Handle error

	}
	console.debug(this);
}
// Inherits from Modal
// http://stackoverflow.com/a/15399594
ModalForm.prototype = Object.create(Modal.prototype);
ModalForm.prototype.constructor = ModalForm;
// ModalForm Methods
ModalForm.prototype.initForm = function(that) {
	console.debug("ModalForm.prototype.initForm()");
	console.debug(that);

	// Call the parent's constructor to make a Modal
	Modal.call(that, that.theElementObj.slice(0,4), that.page, that.theTitle);

	// Get the form URL
	that.url = $(that.theElementObj.pop()) + " " + that.theElementObj[0];

	// Get the form query string
	that.form = $(that.theElementObj.pop());
	that.form.submit(that, that.submit);
	$("button[type=reset]", that.form).click(that.cancel);

	console.debug("ModalForm title = " + that.title, 2);

	// If the form has a location (Join Advocate, Contact Us), set up a proper Location object to handle these.
	if ($("input.location", that.form).attr("id")) {
//		this.location = new Location("#" + $("input.location", this.form).attr("id"), "#" + $("input.location", this.form).siblings("input[type=hidden]").attr("id"), null, false);
		that.location = new Location("#" + $(that.form).attr("id") + " input.location", "#" + $(that.form).attr("id") + " input.location ~ input[type=hidden]", null, false);
	}

};
ModalForm.prototype.loadForm = function(that, callback) {
	console.debug("ModalForm.loadForm(");
	console.debug(that);
	console.debug(callback);

//	var title = (typeof theTitle != "undefined") ? theTitle : ((typeof this.title != "undefined") ? this.title : "Join Advocate");

// TODO:  Pass the URL as an argument into the ModalForm object at initialization, so we can vary the form we load

	// Get the jQuery element from the object if we haven't yet initialized the modal
	var theElement = (!that.isInitialized) ? that.theElementObj[0] : that.element;
	var theURL = (!that.isInitialized) ? that.theElementObj[5] + " " + theElement : that.url;
	var theContainerID = theElement + "-container";

	if ($(theContainerID).length == 0) {
		console.debug("loading " + theURL, 2);

		$("body").append('<div id="' + theContainerID.replace("#","") + '"></div>');
		$(theContainerID).load(theURL, function(response, status, jqXHR) {
			if ( status == "error" ) {
				console.debug("Error loading " + theElement + " modal", 2);

// TODO:  Handle the error

			} else {
				console.debug("load status = " + status, 2);

				// Set up a couple of things, since we're loading inside a modal, rather than in the standalone page
				$(theElement).hide().parent().removeClass("hidden");
				$("input.type", theElement).val($("input.type", theElement).val().substr(0, $("input.type", theElement).val().indexOf(" ")) + " Modal");

				// Run the callback function
				callback(that);

				// Compile the Angular directives within the modal
				angular.element(document).injector().invoke(function($compile) {
					$compile($(theContainerID))(that.page.ngScope);
				});

				// Set hidden fields
				$("input.referer", theElement).val(window.location.href);
				$("input.userAgent", theElement).val(navigator.userAgent);
				if (typeof WURFL != "undefined")
					$("input.device", theElement).val(JSON.stringify(WURFL));	// Requires wurfl.js

			}
		});
	} else
		console.debug("already loaded " + theElement, 2);


/*
	// Add the Join Advocate form to the page
	$("body").append('<div id="join" class="modal hidden">' +
						'<div class="container">' +
							'<header>' +
								'<h1>' + title + '</h1>' +
								'<a class="close" href="#" title="close">x</a>' +
							'</header>' +

							'<form class="join" action="https://docs.google.com/forms/d/1y0rltyK_RwDiy3kSMsuXPNDilLuX4ccOOqJH8NMlP7I/formResponse" method="POST" id="ss-form" target="_self" onsubmit="" autocomplete="on">' +

								'<fieldset>' +
									'<label class="name" for="entry_486126353">Enter your name</label>' +
									'<input class="name" type="text" name="entry.486126353" value="" id="entry_486126353" dir="auto" aria-label="Name" title="" required placeholder="Your Name">' +
								'</fieldset>' +

								'<fieldset>' +
									'<label class="email" for="entry_1188935479">Enter your Email address</label>' +
									'<input class="email" type="email" name="entry.1188935479" value="" id="entry_1188935479" dir="auto" aria-label="Email - Must be a valid email address" title="Must be a valid email address" required placeholder="Email address">' +
								'</fieldset>' +

								'<fieldset>' +
									'<label class="location" for="entry_601326317">Enter your location to connect with your local reps</label>' +
									'<button id="join-current" class="current tooltip" name="join-current" type="button" value="current" title="Use your current location"><img src="img/geocode.png" alt="Use your current location" /></button>' +
									'<input class="location" type="text" name="entry.601326317" value="" id="entry_601326317" dir="auto" aria-label="Location" title="" placeholder="Where do you live?">' +
									'<input class="hidden" type="hidden" name="entry.899064948" value="" id="entry_899064948">' +
								'</fieldset>' +

								'<fieldset>' +
									'<label class="interest" for="entry_1235129365">Enter your area of interest</label>' +
									'<select class="interest" name="entry.1235129365" id="entry_1235129365" aria-label="Area of Interest" title="">' +
										'<option value="">Political area of interest</option>' +
										'<option value="voter">Individual voter</option>' +
										'<option value="politician">Politician holding office</option>' +
										'<option value="candidate">Candidate running for office</option>' +
										'<option value="manager">Campaign manager or staffer</option>' +
									'</select>' +
								'</fieldset>' +
*/
/*
								'<fieldset>' +
									'<label class="comments" for="entry_670622658">Comments</label>' +
									'<textarea class="comments" name="entry.670622658" id="entry_670622658" dir="auto" aria-label="Comments" placeholder="Your comments"></textarea>' +
								'</fieldset>' +
*/
/*
								'<input class="type" type="hidden" name="entry.1285458186" value="Join Modal" id="entry_1285458186" dir="auto" aria-label="Form Type" title="">' +
								'<input class="referer" type="hidden" name="entry.1033723372" value="" id="entry_1033723372" dir="auto" aria-label="Referer" title="">' +

								'<button class="submit" type="submit" name="submit" value="Submit" id="ss-submit">Join Advocate</button>' +
								'<button class="reset" type="reset" name="cancel" value="Cancel" id="ss-cancel">cancel</button>' +

							'</form>' +
						'</div>' +
					'</div>');
*/
	return $(theElement);
};
ModalForm.prototype.showCallback = function(event) {
	console.debug("ModalForm.showCallback(");
	console.debug(event);

	// Get the context
	var that = event.data;
	console.debug(that, 2);

// TODO:  Pass the proper callback in when we initialize the page, so it's not hard-coded here.

	// This is totally a hack, but check to see which modal is showing, so we do the right thing.
	if ($(event.target).hasClass("invite")) {
		console.debug("using invite handler");

		// Check for query string parameters on the click handler
		var query = decodeURIComponent(event.currentTarget.search.replace("?",""));

		if (query) {
			console.debug("found query parameters in click handler:",2);
			console.debug(query,2);

//			$("fieldset.representatives > span input[type='checkbox']", that.form).addClass("hidden");

			// Shortcut if the user selects "all"
			if (query == "all") {
				var checkboxes = $("fieldset.representatives > label.all input[type='checkbox']", that.form);
				if (!checkboxes.prop("checked"))
					checkboxes[0].click();

			} else {
				var checkboxes = $("fieldset.representatives > span input[type='checkbox']", that.form);

				// Iterate through the checkboxes, checking any that are selected
				checkboxes.each(function(i, element) {
					console.debug("checking #" + i);
					console.debug(element);

					if ($(element).val() == query) {
						$(element).prop("checked", true);

						return false;
					}

				});
			}
		} else
			console.debug("did not find query parameters in click handler",2);
	}

	return false;
};	
ModalForm.prototype.submit = function(event) {
	console.debug("ModalForm.submit(");
	console.debug(event);

	// Grab the context
	var that = event.data;
	console.debug(that, 2);

	// Turn on the loading spinner while the submit happens
	that.location.page.startLoading("Submitting...");

/*
	// Set hidden fields
	$("input.referer", that.form).val(window.location.href);
	$("input.userAgent", that.form).val(navigator.userAgent);
	if (typeof WURFL != "undefined")
		$("input.device", that.form).val(JSON.stringify(WURFL));	// Requires wurfl.js
*/

/*
	This is the Google Spreadsheet:

	<iframe src="
		https://docs.google.com/spreadsheets/d/1f_GAYfF76upMt2Us3kuVCK92Zc93np82U_yoq-MXeQo/pubhtml?gid=677216200&amp;single=true&amp;widget=true&amp;headers=false"></iframe>
		https://docs.google.com/spreadsheets/d/1f_GAYfF76upMt2Us3kuVCK92Zc93np82U_yoq-MXeQo/pubhtml

	Using google Spreadsheets as a Database with the Google Visualization API Query Language - OUseful.Info, the blog...
	http://blog.ouseful.info/2009/05/18/using-google-spreadsheets-as-a-databace-with-the-google-visualisation-api-query-language/
*/

	// Submit the form to Google Spreadsheets via AJAX
	$.ajax({
		url: $(that.form).attr("action"), 
		data: $(that.form).serialize(),
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

			// Store the Email in a cookie, so we know they've already submitted
			that.location.page.setUserEmailCookie($("input[type='email']", that.form).val());

/*
			$(that).siblings(".thanks").find("button.close").click(function() {
				window.history.go(-1);
			});
*/
			// Show the Thank You message
			$(that.element).addClass("complete");

/*
			that.close.click();
*/

			// Update the Angular scope, to capture any updates that occurred due to the submission
			var ngScope = that.page.getNgScope();
			if (ngScope) {
//				alert("ModalForm.submit:  ngScope.$apply();");
				ngScope.$apply();
			}

			that.location.page.stopLoading();
		}
	});

	event.preventDefault();
	return false;
};
ModalForm.prototype.cancel = function(event) {
	console.debug("ModalForm.cancel(");
	console.debug(event);

// TODO:  Figure out how to keep from showing error states when empyting required inputs

	// Clear inputs
	$("input:not([type=hidden],[type=checkbox],[type=radio]), select, textarea", this.form).val("");
	$("input[type=checkbox], input[type=radio]", this.form).prop("checked", false);
//	return false;
};
ModalForm.prototype.handleSubmitSuccess = function() {
	console.debug("ModalForm.handleSubmitSuccess()");

// TODO:  Should be using this, probably

};
ModalForm.prototype.handleSubmitError = function(err) {
	console.debug("ModalForm.handleSubmitError(");
	console.debug(err);

// TODO:  Should be using this, probably

};
ModalForm.prototype.validateLocation = function(theFieldID) {
	console.debug("ModalForm.validateLocation(" + theFieldID + ")");

// TODO:  Actually do the validation *or* switch to HTML5 default validation	

};
ModalForm.prototype.validateEmail = function(theFieldID) {
	console.debug("ModalForm.validateEmail(" + theFieldID + ")");

// TODO:  Actually do the validation *or* switch to HTML5 default validation	
	
};
ModalForm.prototype.validateExistance = function(theFieldID) {
	console.debug("ModalForm.validateExistance(" + theFieldID + ")");

// TODO:  Actually do the validation *or* switch to HTML5 default validation	

};


// Tracker Object
function Tracker(thePageURL) {
	console.debug("new Tracker(" + thePageURL + ") {");

	this.pageURL = (typeof thePageURL != "undefined") ? thePageURL : window.location.href;
}
// Tracker Methods
Tracker.prototype.logLocation = function(theLocation) {
	console.debug("Tracker.logLocation(" + theLocation + ")");

};
Tracker.prototype.logFormAction = function(theFormID, theAction) {
	console.debug("Tracker.logFormAction(" + theFormID + ", " + theAction + ")");

	// theAction = [start,submit,cancel,error]
};
Tracker.prototype.logRepAction = function(theRep, theRepDetails, theAction) {
	console.debug("Tracker.logRepAction(" + theRep + ", " + theRepDetails + ", " + theAction + ")");

	// theAction = [list,detail,share,favorite,invite,connect-[web,email,phone,twitter,facebook,linkedin,youtube,instagram,google+],vote]]
};
Tracker.prototype.logClick = function(theAnchor) {
	console.debug("Tracker.logClick(" + theAnchor + ")");
	
};


// Map Object
function Map(theElementID, theLocation) {
	console.debug("new Map(");
	console.debug(theElementID);
	console.debug(theLocation);

	this.element = $(theElementID);
	this.location = (theLocation instanceof Location) ? theLocation : null;
	this.m2f = 3.28084;	// Convert 1 meter to feet
	this.gMap = null;
}
// Map Methods
Map.prototype.getElement = function() {
	console.debug("Map.getElement()");
	console.debug(this.element);

	return this.element;
};
Map.prototype.setElement = function(theElementID) {
	console.debug("Map.setElement(" + theElementID + ")");

	this.element = $(theElementID);
};
Map.prototype.getLocation = function() {
	console.debug("Map.getLocation()");
	console.debug(this.location);

	return this.location;
};
Map.prototype.setLocation = function(theLocation) {
	console.debug("Map.setLocation(" + theLocation + ")");

// TODO:  Redraw the map position

	this.location = (typeof theLocation != "undefined") ? theLocation : null;
};
Map.prototype.draw = function() {
	console.debug("Map.draw()");

	if (this.location.isValid()) {
		console.debug("location is valid", 2);
		console.debug(this.location, 2);

		// These are the Google Map styles per design
		var stylesArray = [
			{"featureType": "landscape.man_made", "elementType": "geometry", "stylers":[{"color": "#f4f4f4"}]},
			{"featureType": "water", "stylers":[{"color": "#E6F1F7"}]},
			{"featureType": "poi.park", "elementType": "geometry", "stylers":[{"color": "#e7f1ed"}]},
			{"featureType": "road.highway", "elementType": "geometry.fill", "stylers":[{"color": "#e3e3e3"}]},
			{"featureType": "road.highway", "elementType": "geometry.stroke", "stylers":[{"color": "#aeafaf"}]},
			{"featureType": "poi.medical", "stylers":[{"color": "#808080"}, {"visibility": "off"}]},
			{"featureType": "poi.school", "stylers":[{"visibility": "off"}]},
			{"featureType": "poi.business", "stylers":[{"visibility": "off"}]},
			{"featureType": "poi.sports_complex", "elementType": "geometry", "stylers":[{"visibility": "off"}]},
			{"featureType": "transit", "elementType": "geometry", "stylers":[{"visibility": "off"}]},
			{"featureType": "landscape.natural.terrain", "elementType": "geometry.fill", "stylers":[{"color": "#f2f2f2"}]},
			{"featureType": "landscape.natural.terrain", "stylers":[{"color": "#f2f2f2"}]},
			{"featureType": "landscape", "elementType": "labels.text", "stylers":[{"visibility": "off"}]},
			{"featureType": "road.local", "elementType": "labels.text.fill", "stylers":[{"color": "#a9a9a9"}]},
			{"featureType": "road.arterial", "elementType": "labels.text.fill", "stylers":[{"color": "#a9a9a9"}]},
			{"featureType": "road.highway", "elementType": "labels.text.fill", "stylers":[{"color": "#a9a9a9"}]},
			{"featureType": "transit.station", "elementType": "labels.text.fill", "stylers":[{"color": "#a9a9a9"}]},
			{"featureType": "poi.attraction", "elementType": "labels.text.fill", "stylers":[{"color": "#808080"}]},
			{"featureType": "poi.place_of_worship", "elementType": "labels.text.fill", "stylers":[{"color": "#808080"}]},
			{"featureType": "road.local", "elementType": "labels.text", "stylers":[{"visibility": "off"}]},
			{"featureType": "road", "elementType": "labels", "stylers":[{"visibility": "off"}]},
			{"featureType": "poi.park", "elementType": "labels.text", "stylers":[{"visibility": "off"}]},
			{"featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers":[{"color": "#6f6f6f"}]},
			{"featureType": "poi", "elementType": "labels.text.fill", "stylers":[{"color": "#a9a9a9"}, {"visibility": "on"}]},
			{"featureType": "transit.station.rail", "elementType": "labels", "stylers":[{"visibility": "off"}]},
			{"featureType": "poi", "elementType": "labels", "stylers":[{"visibility": "off"}]}
		];

		// If we're using the current location, draw a circle of uncertainty
		if (this.location.getLocationIsCurrent()) {
			console.debug("Using a current location",2);

			var geo = this.location.getLocationGeo();
			var accuracy = this.location.getLocationAccuracy();

// TODO:  See if we can switch to static map API

			// Create the map with mostly default values
			this.gMap = new google.maps.Map(document.getElementById(this.element.attr("id")), {
				disableDefaultUI: true,
				draggable: false,
				scrollwheel: false
			});

			// Style the map
			// https://developers.google.com/maps/tutorials/customizing/styling-the-base-map
			this.gMap.set("styles", stylesArray);

			// Draw the circle of uncertainty (two, as per design)
			var circle1 = new google.maps.Circle({
				strokeOpacity: 0,
				fillColor: '#FD4848',
				fillOpacity: 0.4,
				map: this.gMap,
				center: {lat: geo.lat, lng: geo.lon},
				radius: (accuracy * 7/4)	// This circle is a little larger than the accuracy
			});

			// Draw the circle of uncertainty
			var circle2 = new google.maps.Circle({
				strokeOpacity: 0,
				fillColor: '#FD4848',
				fillOpacity: 0.5,
				map: this.gMap,
				center: {lat: geo.lat, lng: geo.lon},
				radius: accuracy
			});

			// Scale and reposition the map appropriately
			var bounds = new google.maps.LatLngBounds();
			bounds.extend(new google.maps.LatLng(geo.lat + ((accuracy*3) / 111000), geo.lon));
			bounds.extend(new google.maps.LatLng(geo.lat - ((accuracy*3) / 111000), geo.lon));
			this.gMap.fitBounds(bounds);

// TODO:  See if we can reverse geocode from the Google Map, so we don't need to do it separately.

		} else {
			console.debug("Not using current location", 2);

			// If the user just submitted a text field that we haven't geocoded yet, try that first
			var locationText = this.location.getLocationText();
			var locationIsGeocoded = this.location.getLocationIsGeocoded();
			if (locationText) {
				console.debug("location text exists", 2);
				console.debug(locationText, 2);

				// Store our current scope for the callback, below
				var that = this;

				// Get the geocode from the plain-text position entry
				var geocoder = new google.maps.Geocoder();
				geocoder.geocode({"address": locationText}, function(results, status) {
					console.debug("getting the geocode");
					console.debug(locationText);

					// Doublecheck the return value
					if (status == google.maps.GeocoderStatus.OK) {
						console.debug("Geocode okay");
						console.debug(results);

						// Create the map with mostly default values
						that.gMap = new google.maps.Map(document.getElementById(that.element.attr("id")), {
							disableDefaultUI: true,
							draggable: false,
							scrollwheel: false
						});

						// Style the map
						// https://developers.google.com/maps/tutorials/customizing/styling-the-base-map
						that.gMap.set("styles", stylesArray);

						// Scale and reposition the map appropriately
						that.gMap.setCenter(results[0].geometry.location);
						that.gMap.fitBounds(results[0].geometry.viewport);

						// Set a minimum zoom level
						google.maps.event.addListenerOnce(that.gMap, "zoom_changed", function() {
							console.debug("rezooming map if greater than 15 (was " + that.gMap.getZoom() + ")", 2);
							that.gMap.setZoom(Math.min(15, that.gMap.getZoom()));
						});

						// Draw the point
						var marker = new google.maps.Marker({
							position: results[0].geometry.location,
							map: that.gMap
						});

					} else {
						console.debug("Geocode was not successful for the following reason: " + status);

// TODO:  Handle Google Maps error

					}
				});
			} else {
				console.debug("no location text (skipping map)", 2);
				console.debug(this.location, 2);

// TODO:  Handle missing text

			}
		}
	} else {
		console.debug("location is not valid (skipping map)",2);
		console.debug(this.location,2);

// TODO:  Handle invalid locations

	}
};
Map.prototype.roundTenth = function(x) {
	console.debug("Map.roundTenth(");
	console.debug(x);

	return (Math.round(x * 10) / 10);
};


// RepList Object
function RepList(theElementID, theLocation, thePage) {
	console.debug("new RepList(" + theElementID + ", " + theLocation +  + ", " + thePage + ") {");

	this.element = $(theElementID);
	this.location = (theLocation instanceof Location) ? theLocation : null;
	this.page = (thePage instanceof Page) ? thePage : new Page();
	this.data = {};
/*
	this.data = [
		"ocd-division/country:us/state:ca": {
			name: "California",
			offices: [
				"United States Senate": [
					{
						name: "Dianne Feinstein",
						address: [
							{
								city: "Washington",
								line1: "331 Hart Senate Office Building",
								state: "DC",
								zip: "20510"
							}
						],
						channels: [
							{
								id: "SenatorFeinstein",
								type: "Facebook"
							},
							{
								id: "SenFeinstein",
								type: "Twitter"
							}
						],
						party: "Democratic",
						phones: [
							"(202) 224-3841"
						],
						photoUrl: "http://feinstein.senate.gov/public/_images/aboutdianne/officiaphoto-thumbl.jpg",
						roles: [
							"legislatorUpperBody"
						],
						urls: [
							"http://www.feinstein.senate.gov/public/"
						]
					}
				]
			]
		}
	];
*/
	this.googleAPIKey = "AIzaSyAVqLHZ4NKXp8goalS25-YUqexpP2-JPn4";
}
// RepList Methods
RepList.prototype.getElement = function() {
	console.debug("RepList.getElement()");
	console.debug(this.element);
	return this.element;
};
RepList.prototype.getGoogleAPIKey = function() {
	console.debug("RepList.getGoogleAPIKey()");
	console.debug(this.googleAPIKey);
	return (typeof this.googleAPIKey != "undefined") ? this.googleAPIKey : null;
};
RepList.prototype.setElement = function(theElementID) {
	console.debug("RepList.setElement(" + theElementID + ")");
	this.element = $(theElementID);
};
RepList.prototype.getLocation = function() {
	console.debug("RepList.getLocation()");
	console.debug(this.location);
	return this.location;
};
RepList.prototype.setLocation = function(theLocation) {
	console.debug("RepList.setLocation(" + theLocation + ")");

// TODO:  Reload the Rep List

	this.location = (typeof theLocation != "undefined") ? theLocation : null;
};
RepList.prototype.load = function() {
	console.debug("RepList.load()");
	// https://developers.google.com/civic-information/docs/using_api

	// For now, we're only going to search for results in valid countries
	if (this.location.isCountryValid()) {

//		alert("valid country (" + this.location.getLocationCountry() + ")");

		// First, get the best address from the location
		// 1. If this is a current location, use geocode, otherwise:
		// 2. Text
		// 3. Zip
		var address = null;

		if (this.location.getLocationIsCurrent()) {
			var geo = this.location.getLocationGeo();
			if ($.isNumeric(geo.lat) && $.isNumeric(geo.lon))
				address = geo.lat + "," + geo.lon;
		}
		if (!address)
			address = (this.location.getLocationText() || null);
		if (!address)
			address = (this.location.getLocationZip() || null);

		// If we have a valid address, prep and query the Civic Info API
		if (address) {
			console.debug("got a valid address = " + address, 2);

			var theURL = "https://www.googleapis.com/civicinfo/v2/representatives?" + 
				"key=" + this.getGoogleAPIKey() + "&" +
				"address=" + address;

			// Run the query
			$.ajax({
				context: this,
				dataType: "json",
				url: theURL,
				success: this.handleLoadSuccess,
				error: this.handleLoadError
			});

		} else {
			console.debug("no valid address");

	// TODO:  Handle error

		}
	} else {
		console.debug("not in a valid country");
		this.handleLoadError(false, this);
	}
};

RepList.prototype.handleLoadSuccess = function(data) {
	console.debug("RepList.handleLoadSuccess(");
	console.debug(data);

	// Store our current scope for the callback, below
	var that = this;

	if ((typeof data.divisions != "undefined") && data.divisions) {

		// Sort the data
		var sortedDivisions = Object.keys(data.divisions).sort();
		console.debug("sorted divisions = ", 2);
		console.debug(sortedDivisions, 2);

		// Grab the reps
		var repData = {};
		for (var divKey in sortedDivisions) {
			var divValue = data.divisions[sortedDivisions[divKey]];

			console.debug("divKey = " + divKey + ", divValue = ", 2);
			console.debug(divValue, 2);

			if (typeof divValue.officeIndices != "undefined") {
				repData[sortedDivisions[divKey]] = {
					name: divValue.name,
					offices: new Array()
				};

				$.each(divValue.officeIndices, function(officeKey, officeValue) {
					if (typeof data.offices[officeValue].officialIndices == "undefined") {

						// The office is vacant
						console.debug("office is vacant", 2);
					} else
						$.each(data.offices[officeValue].officialIndices, function(officialKey, officialValue) {
							console.debug("officialValue = " + officialValue, 2);

							// Grab and tweak a few specific values for display and subsequent queries
							data.officials[officialValue].role = ((typeof data.offices[officeValue].roles != "undefined") && (data.offices[officeValue].roles.length > 0)) ? data.offices[officeValue].roles[0] : "";
							data.officials[officialValue].office = data.offices[officeValue].name;
							data.officials[officialValue].photoUrl = (typeof data.officials[officialValue].photoUrl != "undefined") ? data.officials[officialValue].photoUrl : "";
							repData[sortedDivisions[divKey]].offices.push(data.officials[officialValue]);
							data.officials[officialValue].inviteLinkQuery = JSON.stringify({'ocd_id':sortedDivisions[divKey],'official':data.officials[officialValue].name}); // This is a manufactured string value that's passed to the invite modal form to indicate which representative is being invited
							data.officials[officialValue].initials = data.officials[officialValue].name.split(" ")[0].charAt(0) + data.officials[officialValue].name.split(" ").pop().charAt(0); // Only two initials if the representative has more than two names listed
							data.officials[officialValue].random = (data.officials[officialValue].initials.charCodeAt(0) + data.officials[officialValue].initials.charCodeAt(data.officials[officialValue].initials.length-1)) % 5;  // A number [0-4] based on the initials

						});
				});
			}
		}

		that.data = repData;
		console.debug("that.data = ", 2);
		console.debug(that.data, 2);
		that.show();
	} else {
		console.debug("no valid data returned");
		this.handleLoadError(false, this);
	}
};
RepList.prototype.handleLoadError = function(err, context) {
	console.debug("RepList.handleLoadError(");
	console.debug(err);
	console.debug(context);

	// Handle passed context
	var that = (!err && (typeof context != "undefined")) ? context : this;

	// Indicate to the Angular scope that the load completed erroneously
	var ngScope = that.page.getNgScope();
	if ((typeof ngScope != "undefined") && ngScope) {
		console.debug("Found Angular scope!", 2);

		ngScope.loaded = true;

		// Also apply the updates to Angular
//		alert("RepList.handleLoadError:  ngScope.$apply();");
//		ngScope.$apply();
	} else
		console.debug("No Angular scope found!", 2);
};
RepList.prototype.show = function() {
	console.debug("RepList.show()");
	console.debug(this.data);

	// Make sure we have Rep data
	if (this.data && Object.keys(this.data).length) {
		console.debug("found data to show:", 2);
		console.debug(this.data, 2);

		// Transfer rep data into the Angular scope, so we can update the view
		var ngScope = this.page.getNgScope();
		if ((typeof ngScope != "undefined") && ngScope) {
			console.debug("Found Angular scope!", 2);

			ngScope.results = this.data;
			ngScope.loaded = true;

			// Also apply the updates to Angular
//			alert("RepList.show:  ngScope.$apply();");
			ngScope.$apply();
		} else
			console.debug("No Angular scope found!", 2);

		// Turn on tooltips in the newly loaded content
		$('.tooltip').tooltipster({
			offsetX: 5,
			position: "bottom-left"
		});

		return true;
	} else {
		console.debug("no valid rep data");
		return false;
	}
};
RepList.prototype.filter = function(theFilter) {
	console.debug("RepList.filter(" + theFilter + ")");

// TODO:  Handle filtering (need to find a source for candidates, not just incumbents)
	
};
RepList.prototype.handleConnect = function(theRep) {
	console.debug("RepList.handleConnect(");
	console.debug(theRep);

// TODO:  Display coming soon dialog for connecting to a rep

	alert("Connect!");
};
RepList.prototype.handleFavorite = function(theRep) {
	console.debug("RepList.handleFavorite(");
	console.debug(theRep);

// TODO:  Display coming soon dialog for favoriting a rep

	alert("Favorite!");
};
RepList.prototype.handleShare = function(theRep) {
	console.debug("RepList.handleShare(");
	console.debug(theRep);

// TODO:  Display coming soon dialog for sharing a rep

	alert("Share!");
};


// RepDetails Object
function RepDetails(theRepElementID, theVotesElementID, theOCD_ID, theRole, theOffice, theOfficial, thePage) {
	console.debug("new RepDetails(" + theRepElementID + ", " + theVotesElementID + ", " + theOCD_ID + ", " + theRole + ", " + theOffice + ", " + theOfficial + ", " + thePage + ") {");

	// Check for and then grab query string parameters so we can get started
	var query = parseURL();

	this.element = $(theRepElementID);
	this.voteElement = $(theVotesElementID);
	this.OCD_ID = ((typeof theOCD_ID != "undefined") && theOCD_ID) ? theOCD_ID : (((typeof query.ocd_id != undefined) && query.ocd_id) ? decodeURIComponent(query.ocd_id) : "");
	this.role = ((typeof theRole != "undefined") && theRole) ? theRole : (((typeof query.role != undefined) && query.role) ? decodeURIComponent(query.role) : "");
	this.office = ((typeof theOffice != "undefined") && theOffice) ? theOffice : (((typeof query.office != undefined) && query.office) ? decodeURIComponent(query.office) : "");
	this.official = ((typeof theOfficial != "undefined") && theOfficial) ? theOfficial : (((typeof query.official != undefined) && query.official) ? decodeURIComponent(query.official) : "");
	this.page = (thePage instanceof Page) ? thePage : new Page();
	this.data = {};
	this.hasData = false;
	this.hasExtended = false;
	this.votes = {};
	this.hasVotes = false;
	this.googleAPIKey = "AIzaSyAVqLHZ4NKXp8goalS25-YUqexpP2-JPn4";
	this.sunlightAPIKey = "f36efc0ec23f4719b097ff89b48cf1ea";

	// Init the rep data
	this.loadBasic();
}
// RepDetails Methods
RepDetails.prototype.getElement = function() {
	console.debug("RepDetails.getElement()");
	console.debug(this.element);
	return this.element;
};
RepDetails.prototype.setElement = function(theElementID) {
	console.debug("RepDetails.setElement(" + theElementID + ")");
	this.element = $(theRepElementID);
	return this.element;
};
RepDetails.prototype.getOCD_ID = function() {
	console.debug("RepDetails.getOCD_ID()");
	console.debug(this.OCD_ID);
	return this.OCD_ID;
};
RepDetails.prototype.setOCD_ID = function(theOCD_ID) {
	console.debug("RepDetails.setOCD_ID(" + theOCD_ID + ")");
	this.OCD_ID = (typeof theOCD_ID != "undefined") ? theOCD_ID : null;
	return this.OCD_ID;
};
RepDetails.prototype.getRole = function() {
	console.debug("RepDetails.getRole()");
	console.debug(this.role);
	return this.role;
};
RepDetails.prototype.setRole = function(theRole) {
	console.debug("RepDetails.setRole(" + theRole + ")");
	this.role = (typeof theRole != "undefined") ? theRole : null;
	return this.role;
};
RepDetails.prototype.getOffice = function() {
	console.debug("RepDetails.getOffice()");
	console.debug(this.office);
	return this.office;
};
RepDetails.prototype.setOffice = function(theOffice) {
	console.debug("RepDetails.setOffice(" + theOffice + ")");
	this.office = (typeof theOffice != "undefined") ? theOffice : null;
	return this.office;
};
RepDetails.prototype.getOfficial = function() {
	console.debug("RepDetails.getOfficial()");
	console.debug(this.official);
	return this.official;
};
RepDetails.prototype.setOfficial = function(theOfficial) {
	console.debug("RepDetails.setOfficial(" + theOfficial + ")");
	this.official = (typeof theOfficial != "undefined") ? theOfficial : null;
	return this.official;
};
RepDetails.prototype.getHasData = function() {
	console.debug("RepDetails.getHasData()");
	console.debug(this.hasData);
	return this.hasData;
};
RepDetails.prototype.getHasExtended = function() {
	console.debug("RepDetails.getHasExtended()");
	console.debug(this.hasExtended);
	return this.hasExtended;
};
RepDetails.prototype.getHasVotes = function() {
	console.debug("RepDetails.getHasVotes()");
	console.debug(this.hasVotes);
	return this.hasVotes;
};
RepDetails.prototype.loadBasic = function() {
	console.debug("RepDetails.loadBasic()");
	console.debug("getting data for OCD_ID = \"" + this.OCD_ID + "\", role = \"" + this.role + "\", office = \"" + this.office + "\", official = \"" + this.official + "\"", 2);

	// Build the query string for Google Civic Data API
	// https://developers.google.com/civic-information/docs/v2/representatives/representativeInfoByDivision
	var theURL = "https://www.googleapis.com/civicinfo/v2/representatives/" + encodeURIComponent(this.OCD_ID) + 
		"?key=" + this.googleAPIKey + 
		((this.role) ? "&roles=" + this.role : "");
	console.debug("theURL = " + theURL, 2);

	// Now query for the reps
	$.ajax({
		context: this,
		dataType: "json",
		url: theURL,
		success: this.handleLoadBasicSuccess,
		error: this.handleLoadBasicError,
		complete: this.show
	});
};
RepDetails.prototype.handleLoadBasicSuccess = function(data) {
	console.debug("RepDetails.handleLoadBasicSuccess(");
	console.debug(data);

	// Store our current scope for the callback, below
	var that = this;
	
	// Find the right rep by name
	console.debug("looking for official \"" + that.official + "\"", 2);
	$.each(data.officials, function(officialKey, official) {
		console.debug(officialKey + ": ", 2);
		console.debug(official, 2);

		if (official.name == that.official) {
			console.debug("found official \"" + official.name + "\"", 2);

			// Grab the rep's basic data
			that.data = official;
			that.hasData = true;

			// Grab the rep's division
			that.data.division = data.divisions[that.OCD_ID].name;

			// Set up some values for display purposes
			that.data.initials = that.data.name.split(" ")[0].charAt(0) + that.data.name.split(" ").pop().charAt(0); // Only two initials if the representative has more than two names listed
			that.data.random = (that.data.initials.charCodeAt(0) + that.data.initials.charCodeAt(that.data.initials.length-1)) % 5;  // A number [0-4] based on the initials


			// Build out a set of address queries for Google Maps hyperlinks
			$.each(that.data.address, function(i, address) {
				var q = "";
				$.each(address, function(key, value) {
					q += value + "+";
				});
				that.data.address[i].q = q;
			});

			// Find this rep's office
			$.each(data.offices, function(officeKey, office) {
				console.debug(officeKey + ": ", 2);
				console.debug(office, 2);
				
				if (office.officialIndices.indexOf(officialKey) >= 0) {
					console.debug("found office \"" + office.name + "\"", 2);

					that.data.office = office;
				}
			});

			// Load any extended data
			that.loadExtended();
		}
	});
	console.debug("this.data = ", 2);
	console.debug(that.data, 2);
};
RepDetails.prototype.handleLoadBasicError = function(err, context) {
	console.debug("RepDetails.handleLoadBasicError(");
	console.debug(err);
	console.debug(context);

	// Handle passed context
	var that = (!err && (typeof context != "undefined")) ? context : this;

	// Indicate to the Angular scope that the load completed erroneously
	var ngScope = that.page.getNgScope();
	if ((typeof ngScope != "undefined") && ngScope) {
		console.debug("Found Angular scope!", 2);

		ngScope.loaded = true;

		// Also apply the updates to Angular
//		alert("RepList.handleLoadError:  ngScope.$apply();");
//		ngScope.$apply();
	} else
		console.debug("No Angular scope found!", 2);
};
RepDetails.prototype.loadExtended = function() {
	console.debug("RepDetails.loadExtended()");

	if (!$.isEmptyObject(this.data)) {
		console.debug("found data, checking role for extended availability", 2);

		// See if this rep is in the upper or lower body of a country-level office (US Senate or US House)
		if (((typeof this.data.office.levels != "undefined") && (this.data.office.levels.indexOf("country") > -1)) && ((typeof this.data.office.roles != "undefined") && ((this.data.office.roles.indexOf("legislatorUpperBody") > -1) || (this.data.office.roles.indexOf("legislatorLowerBody") > -1)))) {
			console.debug("US Congress!", 2);

			// Now query Sunlight's Congress API for the extended rep data
			// https://sunlightlabs.github.io/congress/
			var theURL = "https://congress.api.sunlightfoundation.com/legislators?" + 
				"apikey=" + this.sunlightAPIKey + "&" +
				"per_page=all&" + 
				"fields=party,gender,state,state_name,district,title,chamber,senate_class,state_rank,bioguide_id,ocd_id,first_name,last_name,terms,term_end&" +
				"ocd_id=" + this.OCD_ID + "&" +
				"query=" + this.data.name.split(" ").slice(-1)[0];

			console.debug("theURL = " + theURL, 2);

			// Now query for the reps
			$.ajax({
				context: this,
				dataType: "json",
				url: theURL,
				success: this.handleLoadExtendedSuccess,
				error: this.handleLoadExtendedError,
				complete: this.show
			});
		} else
			console.debug("not US Congress", 2);
	} else
		console.debug("no data found, skipping extended load", 2);
};
RepDetails.prototype.handleLoadExtendedSuccess = function(data) {
	console.debug("RepDetails.handleLoadExtendedSuccess(");
	console.debug(data);

	// Store our current scope for the callback, below
	var that = this;

	// Make sure we just got the one best result
	if ((typeof data.results[0] != "undefined") && (data.results.length == 1)) {

		// Now, enrich the rep data with the Sunlight extended data
		that.data.extended = data.results[0];
		that.hasExtended = true;

		// Now, see if we can load the votes, limited to US Congress (for now)
		that.loadVotes(2);

	} else {
		console.debug("Error:  More than one result returned from Sunlight!", 2)
		that.handleLoadExtendedError(false, that);
	}
};
RepDetails.prototype.handleLoadExtendedError = function(err, context) {
	console.debug("RepDetails.handleLoadExtendedError(");
	console.debug(err);
	console.debug(context);

	// Handle passed context
	var that = (!err && (typeof context != "undefined")) ? context : this;

	// Indicate to the Angular scope that the load completed erroneously
	var ngScope = that.page.getNgScope();
	if ((typeof ngScope != "undefined") && ngScope) {
		console.debug("Found Angular scope!", 2);

		ngScope.loaded = true;

		// Also apply the updates to Angular
//		alert("RepList.handleLoadError:  ngScope.$apply();");
//		ngScope.$apply();
	} else
		console.debug("No Angular scope found!", 2);
};
RepDetails.prototype.show = function() {
	console.debug("RepDetails.show()");
	console.debug(this.data);

	// Transfer rep data into the Angular scope, so we can update the view
	var ngScope = this.page.getNgScope();
	if (ngScope) {
		console.debug("Found Angular scope!", 2);
		ngScope.repData = this.data;
		ngScope.loaded = true;

		// Also apply the updates to Angular
//		alert("RepDetails.show:  ngScope.$apply();");
		ngScope.$apply();

		// Also update the page title
		document.title = this.data.name + " - Advocate";

		// Turn on tooltips in the newly loaded content
		$('.tooltip').tooltipster({
			offsetX: 5,
			position: "bottom-left"
		});

	} else
		console.debug("No Angular scope found!", 2);
};
RepDetails.prototype.loadVotes = function(n) {
	console.debug("RepDetails.loadVotes(" + n + ")");

	// Check for extended data, which should exist for members of congress 
	if (this.hasExtended) {
		console.debug("Found extended congressional data", 2);

		// Set a default number of votes to load
		if ((typeof n == "undefined") || !n)
			n = 5;

		// See if we can grab their most recent vote
		var theURL = "https://congress.api.sunlightfoundation.com/votes?" + 
			"apikey=" + this.sunlightAPIKey + "&" +
			"fields=question,voted_at,bill,result,url,breakdown,required,voters." + this.data.extended.bioguide_id + "&" +
			"order=voted_at&" +
			"per_page=" + n + "&" +
			"voter_ids." + this.data.extended.bioguide_id + "__exists=true"

		console.debug("theURL = " + theURL, 2);

		// Now query for the votes
		$.ajax({
			context: this,
			dataType: "json",
			url: theURL,
			success: this.handleLoadVotesSuccess,
			error: this.handleLoadVotesError,
			complete: this.showVotes
		});
	} else
		console.debug("Did not find extended congressional data, skipping vote data.", 2);
};
RepDetails.prototype.handleLoadVotesSuccess = function(data) {
	console.debug("RepDetails.handleLoadVotesSuccess(");
	console.debug(data);

	// Store our current scope for the callback, below
	var that = this;

	// Make sure we just got the one best result
	if ((typeof data.results[0] != "undefined") && (data.results.length > 0)) {

		// Clean up the votes data for display
		$.each(data.results, function(vote, result) {
			console.debug("cleaning vote #" + vote, 2);
			console.debug(result, 2);

			// Pull out this rep's vote, to make it easier to find
			data.results[vote].myVote = result.voters[Object.keys(result.voters)[0]].vote;
			delete data.results[vote].voters;

			// Set the order of the votes for display
			var keys = ["Yea", "Nay", "Present", "Not Voting"];
			var voteArray = [];
			$.each(keys, function(i, key) {
				if (typeof result.breakdown.total[key] != "undefined")
					voteArray.push({type: key, count: result.breakdown.total[key]});
					delete result.breakdown.total[key];
			});
			// Now get any nonstandard vote types that slip through
			$.each(result.breakdown.total, function(key, vote) {
				voteArray.push({type: key, count: vote});
				delete result.breakdown.total[key];
			});
			
			console.debug("vote array = ", 2);
			console.debug(voteArray, 2);
			
			data.results[vote].breakdown.total = voteArray;
		});

		// Now, enrich the rep data with the Sunlight votes data
		that.data.votes = data.results;
		that.hasVotes = true;

	} else {
		console.debug("Error with vote results returned from Sunlight!", 2)

// TODO:  Handle this error

	}
};
RepDetails.prototype.handleLoadVotesError = function(err) {
	console.debug("RepDetails.handleLoadVotesError(");
	console.debug(err);

// TODO:  Handle error

};
RepDetails.prototype.showVotes = function() {
	console.debug("RepDetails.showVotes()");
	console.debug(this.data);

	if (this.hasVotes) {
		console.debug("found votes", 2);

		// Update the Angular view
		var ngScope = this.page.getNgScope();
		if (ngScope) {
			console.debug("Found Angular scope!", 2);

			// Also apply the updates to Angular
//			alert("RepDetails.showVotes:  ngScope.$apply();");
			ngScope.$apply();
		} else
			console.debug("No Angular scope found!", 2);

	} else
		console.debug("no votes found", 2);
};
