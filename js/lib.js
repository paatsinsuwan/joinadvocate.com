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


//	Page Object
function Page(theLocationFieldID, theLocationHiddenID, theModalObjs, theModalFormObjs, theMapID, theRepListID, theRepDataID, theVoteID) {
	console.debug("new Page(" + theLocationFieldID + ", " + theLocationHiddenID + ", " + theModalObjs + ", " + theModalFormObjs + ", " + theMapID + ", " + theRepListID + ", " + theRepDataID + ", " + theVoteID + ") {");

	// If initializing as Page(), we're just getting a handle to run Page methods
	if (arguments.length > 0) {
		if ((typeof theLocationFieldID != "undefined") && (typeof theLocationHiddenID != "undefined")) {
			this.location = new Location(theLocationFieldID, theLocationHiddenID, null, true, this);
		}
		this.modals = new Array();
		if (typeof theModalObjs != "undefined")
			for (i in theModalObjs)
				this.modals.push(new Modal(theModalObjs[i]));
		if (typeof theModalFormObjs != "undefined")
			for (i in theModalFormObjs)
				this.modals.push(new ModalForm(theModalFormObjs[i]));
		this.tracker = new Tracker(window.location.href);
		this.map = (typeof theMapID != "undefined") ? new Map(theMapID, this.location) : null;
		this.repList = (typeof theRepListID != "undefined") ? new RepList(theRepListID, this.location) : null;
		this.repData = (typeof theRepDataID != "undefined") ? new RepData(theRepDataID, theVoteID) : null;
		this.ngScope = null;
	} else
		console.debug("initializing empty Page object");



// TODO:  Handle form submissions and grab the variables
// TODO:  If we don't have a location on a page that needs one, use a default location


}
// Page Methods
Page.prototype.startLoading = function(msg) {
	console.debug("Page.startLoading(" + msg + ")");
	$("body").addClass("loading").append("<div id=\"loading\"><div class=\"overlay\">" + msg + "</div></div>");
};
Page.prototype.stopLoading = function() {
	console.debug("Page.stopLoading()");
	$("body.loading").removeClass("loading");
	$("#loading").remove();
};
Page.prototype.getNgScope = function() {
	console.debug("Page.getNgScope()");
	console.debug(this.ngScope);
	return (typeof this.ngScope != "undefined") ? this.ngScope : false;
};
Page.prototype.setNgScope = function(theNgScope) {
	console.debug("Page.setNgScope(");
	console.debug(theNgScope);
	if (typeof theNgScope != "undefined")
		this.ngScope = theNgScope;
};


// Location Object
function Location(theFieldID, theHiddenID, theLocation, doUpdateCookie, thePage) {
	console.debug("new Location(" + theFieldID + ", " + theHiddenID + ", " + theLocation + ", " + doUpdateCookie + ", " + thePage + ") {");

	this.field = (typeof theFieldID != "undefined") ? $(theFieldID) : null;
	this.hidden = (typeof theHiddenID != "undefined") ? $(theHiddenID) : null;
	this.form = (this.field != null) ? this.field.parents("form") : null;
	this.location = ((typeof theLocation != "undefined") && theLocation) ? theLocation : this.getNew();
	// Note that we're using doUpdateCookie to also indicate that the form shouldn't be submitted, which is the case for join and contact forms.
	this.doUpdateCookie = (typeof doUpdateCookie != "undefined") ? doUpdateCookie : true;
	this.valid = this.setFromCookie();
	this.target = "results.html";
	this.page = (thePage instanceof Page) ? thePage : new Page();

	// Initialize the page with location info
	if (this.isValid()) {
		this.geocode();
		this.updateFields();
	}
	// Set up form elements
	$("button.current", this.form).click(this, this.handleUseCurrentLocation);
	this.form.submit(this, this.handleSubmit);
}
// Location Methods
Location.prototype.getNew = function() {
	console.debug("Location.getNew()");
/*
	this.location = {
		geo: {
			lat: 37.8047784,
			lon: -122.43499550000001
		},
		accuracy: 27,
		text: "1580 Beach Street, San Francisco, CA",
		city: "San Francisco",
		state: "CA",
		zip: 94123,
		isGeocoded: [true|false],
		isCurrent: [true|false]
	}
*/
	return {
		geo: {lat: null, lon: null},
		accuracy: null,
		text: null,
		isGeocoded: false,
		isCurrent: false
	};
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

// TODO:  Handle error

					}
				});
			} else {
				console.debug("No valid location to geocode!", 2);

	// TODO:  Handle error

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
				newLocation.zip = geoResults.address_components[i].short_name;	// Zip code
			} else if (geoResults.address_components[i].types.indexOf("administrative_area_level_1") >= 0) {
				newLocation.state = geoResults.address_components[i].short_name;	// State
			} else if (geoResults.address_components[i].types.indexOf("locality") >= 0) {
				newLocation.city = geoResults.address_components[i].long_name;		// City
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
			console.debug("The new location is updated and valid: ");
			console.debug(newLocation);

			this.location = newLocation;
			this.updateFields();
			this.updateCookie();
			return true;
		} else {
			console.debug("no need to update.");
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
	var hiddenVal = this.hidden.val();
	var placeholder = this.field.attr("placeholder");
	var foundLocation = false;

	if (this.isValid()) {
		// See if we're using the current location, or a geocoded text entry
		if (this.getLocationIsCurrent()) {

			// If we have a valid geocode, use it
			if ($.isNumeric(this.location.geo.lat) && $.isNumeric(this.location.geo.lon) && $.isNumeric(this.location.accuracy)) {
				console.debug("using geocode", 2);
				placeholder = "Using your current location";
				fieldVal = "";
				foundLocation = true;
			}

		// Use the text value if it hasn't yet been geocoded
		} else if ((typeof this.location.text != "undefined") && this.location.text) {

			// See if it's been geocoded yet
			if ((typeof this.location.isGeocoded != "undefined") && !this.location.isGeocoded) {
				console.debug("using ungeocoded text", 2);
				placeholder = "Type your zipcode";
				fieldVal = this.location.text;
				foundLocation = true;
			} else {
				// Otherwise, use the formatted address returned from the geocode search
				console.debug("using the formatted address", 2);
				placeholder = this.location.text;
				fieldVal = "";
				foundLocation = true;
			}
		} 

		// Then, stuff the current location object into the hidden input, so we can pass it along.
		hiddenVal = JSON.stringify(this.location);
	}
	
	// If we didn't find a valid location, set up defaults
	if (!foundLocation) {
		console.debug("No valid location yet, usting location.text", 2);
		fieldVal = ((typeof this.location.text != "undefined") && this.location.text) ? this.location.text : "";
		placeholder = "Type your zipcode";
		hiddenVal = null;
	}

	this.field.val(fieldVal);
	this.hidden.val(hiddenVal);
	this.field.attr("placeholder", placeholder);

	// Also apply the updates to Angular
	var ngScope = this.page.getNgScope();
	if (ngScope)
		ngScope.$apply();

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
			var cookieVal = c.substring(9, c.length);
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

	var cookieVal = JSON.stringify(loc);

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
	navigator.geolocation.getCurrentPosition(function(position) {
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
		return false;
	});
};
Location.prototype.handleUseCurrentLocation = function(event) {
	console.debug("Location.handleUseCurrentLocation(");
	console.debug(event);

	var that = (typeof event.data != "undefined") ? event.data : this;

	that.page.startLoading("loading your location");

	that.setFromBrowser(function(that) {
		console.debug("callback function(");
		console.debug(that);

		that.updateFields();

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
	}

	// Update the cookie as we unload the page
	if (that.doUpdateCookie)
		that.updateCookie();

	//  For debugging, uncomment these to keep the page from submitting.
/*
	that.page.stopLoading();
	event.preventDefault();
*/
};


// Modal Object
function Modal(theElementObj, theTitle, theContents) {
	console.debug("new Modal(");
	console.debug(theElementObj);
	console.debug(theTitle);
	console.debug(theContents);

	this.element = null;
	this.open = null;
	this.close = null;
	this.title = (typeof theTitle != "undefined") ? theTitle : null;
	this.contents = (typeof theContents != "undefined") ? theContents : null;

	// Initialize modals and click handlers
	if ((typeof theElementObj != "undefined") && (theElementObj.length == 3)) {
		this.element = $(theElementObj[0]);
		this.open = $(theElementObj[1]);
		this.close = $(theElementObj[2]);

		// Set up initial state
		this.element.hide().removeClass("hidden");
		this.open.data("target", theElementObj[0]);
		this.close.data("target", theElementObj[0]);

		// Set up event handlers
		this.open.click(this.show);
		this.close.click(this.hide);
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
Modal.prototype.show = function() {
	console.debug("Modal.show()");

	$($(this).data("target")).show();
	return false;
};
Modal.prototype.hide = function() {
	console.debug("Modal.hide()");

	$($(this).data("target")).hide();
	return false;
};


// ModalForm Object
function ModalForm(theElementObj, theTitle, theForm) {
	console.debug("new ModalForm(" + theElementObj + ", " + theTitle + ", " + theForm + ") {");

	this.form = null;
	this.location = null;

	if ((typeof theElementObj != "undefined") && (theElementObj.length == 4)) {

		// Call the parent's constructor to make a Modal
		Modal.call(this, theElementObj.slice(0,3), theTitle);
		this.form = $(theElementObj.pop());
		this.form.submit(this.submit);
		$("button[type=reset]", this.form).click(this.cancel);

		// If the form has a location (Join Advocate, Contact Us), set up a proper Location object to handle these.
		if ($("input.location", this.form).attr("id")) {
			this.location = new Location("#" + $("input.location", this.form).attr("id"), "#" + $("input.location", this.form).siblings("input[type=hidden]").attr("id"), null, false);
		}

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
ModalForm.prototype.submit = function(event) {
	console.debug("ModalForm.submit(");
	console.debug(event);

// TODO:  Handle submit

	alert("submit!");

	event.preventDefault();
	return false;
};
ModalForm.prototype.cancel = function() {
	console.debug("ModalForm.cancel()");

	// Clear inputs
	$(":not(input[type=hidden]), input, select, textarea", this.form).val("");
	return false;
};
ModalForm.prototype.handleSubmitSuccess = function() {
	console.debug("ModalForm.handleSubmitSuccess()");
	
};
ModalForm.prototype.handleSubmitError = function(err) {
	console.debug("ModalForm.handleSubmitError(");
	console.debug(err);

};
ModalForm.prototype.validateLocation = function(theFieldID) {
	console.debug("ModalForm.validateLocation(" + theFieldID + ")");

// TODO:  Handle location elements in form
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
Tracker.prototype.logRepAction = function(theRep, theRepData, theAction) {
	console.debug("Tracker.logRepAction(" + theRep + ", " + theRepData + ", " + theAction + ")");

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

		// If we're using the current location, draw a circle of uncertainty
		if (this.location.getLocationIsCurrent()) {
			console.debug("Using a current location",2);

			var geo = this.location.getLocationGeo();
			var accuracy = this.location.getLocationAccuracy();

// TODO:  Switch to static map API

			// Create the map with mostly default values
			this.gMap = new google.maps.Map(document.getElementById(this.element.attr("id")), {
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
				map: this.gMap,
				center: {lat: geo.lat, lng: geo.lon},
				radius: accuracy
			});

			// Scale and reposition the map appropriately
			var bounds = new google.maps.LatLngBounds();
			bounds.extend(new google.maps.LatLng(geo.lat + (accuracy / 111000), geo.lon));
			bounds.extend(new google.maps.LatLng(geo.lat - (accuracy / 111000), geo.lon));
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

						// Scale and reposition the map appropriately
						that.gMap.setCenter(results[0].geometry.location);
						that.gMap.fitBounds(results[0].geometry.viewport);

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
function RepList(theElementID, theLocation) {
	console.debug("new RepList(" + theElementID + ", " + theLocation + ") {");

	this.element = $(theElementID);
	this.location = (theLocation instanceof Location) ? theLocation : null;
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
						urls: [
							"http://www.feinstein.senate.gov/public/"
						]
					}
				]
			]
		}
	];
*/
	this.googleAPIKey = "AIzaSyDn6XiONTTiBm7HPFiC4irVqlGRGW3PiRA";
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

	// First, get the best address from the location
	// 1. Geocode
	// 2. Text
	// 3. Zip
	var address = null;
	var geo = this.location.getLocationGeo();
	if ($.isNumeric(geo.lat) && $.isNumeric(geo.lon))
		address = geo.lat + "," + geo.lon;
	else {
		var text = this.location.getLocationText();
		if (text)
			address = text;
		else {
			var zip = this.location.getLocationZip();
			if (zip)
				address = zip;
			}
		}

	// If we have a valid address, prep and query the Civic Info API
	if (address) {
		console.debug("got a valid address = " + address, 2);

		var theURL = "https://www.googleapis.com/civicinfo/v2/representatives?" + 
			"key=" + this.getGoogleAPIKey() + "&" +
			"address=" + address;

		// Store our current scope for the callback, below
		var that = this;

		$.getJSON(theURL, function(data) {
			console.debug("Success querying the Civic Info API");
			console.debug(data);

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
						offices: {}
					};

					$.each(divValue.officeIndices, function(officeKey, officeValue) {
						repData[sortedDivisions[divKey]].offices[data.offices[officeValue].name] = new Array();
						if (typeof data.offices[officeValue].officialIndices == "undefined") {

							// The office is vacant
							console.debug("office is vacant", 2);
						} else
							$.each(data.offices[officeValue].officialIndices, function(officialKey, officialValue) {
								console.debug("officialValue = " + officialValue, 2);
								repData[sortedDivisions[divKey]].offices[data.offices[officeValue].name].push(data.officials[officialValue]);
							});
					});
				}
			}

			that.data = repData;
			console.debug("that.data = ", 2);
			console.debug(that.data, 2);
			that.show();
		}).error(this.handleLoadError);
	} else {
		console.debug("no valid address");

// TODO:  Handle error

	}
};
/*
RepList.prototype.handleLoadSuccess = function() {
	console.debug("RepList.handleLoadSuccess()");

};
*/
RepList.prototype.handleLoadError = function(err) {
	console.debug("RepList.handleLoadError(");
	console.debug(err);

// TODO:  Handle error

};
RepList.prototype.show = function() {
	console.debug("RepList.show()");
	console.debug(this.data);

	// Make sure we have Rep data
	if (this.data && Object.keys(this.data).length) {
		console.debug("found data to show:", 2);
		console.debug(this.data, 2);

		var that = this;

		// Construct the HTML for the search results
		this.element.empty().append("<select class=\"filter\">" + 
										"<option value=\"current\" selected=\"selected\">Current representatives</option>" + 
										"<option value=\"candidates\">Candidates for office</option>" + 
									"</select>");

		// Iterate through the divisions
		$.each(this.data, function(ocd_id, division) {
			console.debug(ocd_id + ": ", 2);
			console.debug(division, 2);

			var thisDivision = $("<section class=\"division\" id=\"" + ocd_id + "\">" + 
									"<h3>" + division.name + "</h3>" + 
									"<ul></ul>" + 
								"</section>");

			// Iterate through the offices
			$.each(division.offices, function(office, officials) {
				console.debug(office + ": ", 2);
				console.debug(officials, 2);

				// Iterate through the officials (most offices will only have one)
				$.each(officials, function(officialKey, official) {
					console.debug(officialKey + ": ", 2);
					console.debug(official, 2);

					thisDivision.children("ul").append("<li class=\"official\">" + 
															"<a href=\"detail.html?ocd_id=" + ocd_id + "&office=" + office + "&official=" + official.name + "\">" + 
																"<div class=\"u-photo circle\" style=\"background-image: url(" + ((typeof official.photoUrl != "undefined") ? official.photoUrl : "img/fpo-official.png") + ")\" title=\"Photo of " + official.name + "\" />" + 
																"<h4 class=\"p-name\">" + official.name + "</h4>" + 
																"<p class=\"p-role\">" + 
																	office + "<br />" + 
																	official.party +
																"</p>" +
															"</a>" + 
															"<ul class=\"actions\">" + 
																"<li><a class=\"connect\" href=\"#\"><img src=\"img/connect.png\" alt=\"connect\" /></a></li>" + 
																"<li><a class=\"favorite\" href=\"#\"><img src=\"img/favorite.png\" alt=\"favorite\" /></a></li>" + 
																"<li><a class=\"share\" href=\"#\"><img src=\"img/share.png\" alt=\"share\" /></a></li>" + 
															"</ul>" + 
														"</li>");

// TODO:  Turn on connect, favorite, and share handlers

				});
			});
			
			console.debug(thisDivision, 2);
			that.element.append(thisDivision);
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
function RepDetails(theRepElementID, theVotesElementID, theOCD_ID, theName) {
	console.debug("new RepDetails(" + theRepElementID + ", " + theVotesElementID + ", " + theOCD_ID + ", " + theName + ") {");

	this.element = $(theRepElementID);
	this.voteElement = $(theVotesElementID);
	this.OCD_ID = (typeof theOCD_ID != "undefined") ? theOCD_ID : null;
	this.name = (typeof theName != "undefined") ? theName : null;
	this.data = {};
	this.votes = {};
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
};
RepDetails.prototype.getOCD_ID = function() {
	console.debug("RepDetails.getOCD_ID()");
	console.debug(this.OCD_ID);

	return this.OCD_ID;
};
RepDetails.prototype.setOCD_ID = function(theOCD_ID) {
	console.debug("RepDetails.setOCD_ID(" + theOCD_ID + ")");

	this.OCD_ID = (typeof theOCD_ID != "undefined") ? theOCD_ID : null;
};
RepDetails.prototype.getName = function() {
	console.debug("RepDetails.getName()");
	console.debug(this.name);

	return this.name;
};
RepDetails.prototype.setName = function(theName) {
	console.debug("RepDetails.setName(" + theName + ")");

	this.name = (typeof theName != "undefined") ? theName : null;
};
RepDetails.prototype.loadBasic = function() {
	console.debug("RepDetails.loadBasic()");
	
};
RepDetails.prototype.handleLoadBasicSuccess = function() {
	console.debug("RepDetails.handleLoadBasicSuccess()");
	
};
RepDetails.prototype.handleLoadBasicError = function(err) {
	console.debug("RepDetails.handleLoadBasicError(");
	console.debug(err);

};
RepDetails.prototype.loadExtended = function() {
	console.debug("RepDetails.loadExtended()");
	
};
RepDetails.prototype.handleLoadExtendedSuccess = function() {
	console.debug("RepDetails.handleLoadExtendedSuccess()");

};
RepDetails.prototype.handleLoadExtendedError = function(err) {
	console.debug("RepDetails.handleLoadExtendedError(");
	console.debug(err);

};
RepDetails.prototype.show = function() {
	console.debug("RepDetails.show()");
	
};
RepDetails.prototype.loadVotes = function(n) {
	console.debug("RepDetails.loadVotes(" + n + ")");
	
};
RepDetails.prototype.handleLoadVotesSuccess = function() {
	console.debug("RepDetails.handleLoadVotesSuccess()");
	
};
RepDetails.prototype.handleLoadVotesError = function(err) {
	console.debug("RepDetails.handleLoadVotesError(");
	console.debug(err);

};
RepDetails.prototype.showVotes = function() {
	console.debug("RepDetails.showVotes()");
	
};
