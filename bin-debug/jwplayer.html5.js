/**
 * jwplayer.html5 namespace
 *
 * @author pablo
 * @version 6.0
 */
(function(jwplayer) {
	jwplayer.html5 = {};
	jwplayer.html5.version = '6.0.2331';
})(jwplayer);/**
 * HTML5-only utilities for the JW Player.
 * 
 * @author pablo
 * @version 6.0
 */
(function(utils) {
	var DOCUMENT = document, WINDOW = window;
	
	/**
	 * Basic serialization: string representations of booleans and numbers are
	 * returned typed
	 * 
	 * @param {String}
	 *            val String value to serialize.
	 * @return {Object} The original value in the correct primitive type.
	 */
	utils.serialize = function(val) {
		if (val == null) {
			return null;
		} else if (val == 'true') {
			return true;
		} else if (val == 'false') {
			return false;
		} else if (isNaN(Number(val)) || val.length > 5 || val.length == 0) {
			return val;
		} else {
			return Number(val);
		}
	}
	

	/** Filters the sources by taking the first playable type and eliminating sources of a different type **/
	utils.filterSources = function(sources) {
		var selectedType, newSources, extensionmap = utils.extensionmap;
		if (sources) {
			newSources = [];
			for (var i=0; i<sources.length; i++) {
				var type = sources[i].type,
					file = sources[i].file;
				if (!type) {
					type = extensionmap.extType(utils.extension(file));
					sources[i].type = type;
				}

				if (_canPlayHTML5(type)) {
					if (!selectedType) {
						selectedType = type;
					}
					if (type == selectedType) {
						newSources.push(sources[i]);
					}
				}
			}
		}
		return newSources;
	}
	
	/** Returns true if the type is playable in HTML5 **/
	function _canPlayHTML5(type) {
		var mappedType = utils.extensionmap[type];
		return (!!mappedType && !!mappedType.html5 && jwplayer.vid.canPlayType(mappedType.html5));
	}
	
	/** Loads an XML file into a DOM object * */
	utils.ajax = function(xmldocpath, completecallback, errorcallback) {
		var xmlhttp;
		if (_isCrossdomain(xmldocpath) && utils.exists(WINDOW.XDomainRequest)) {
			// IE9
			xmlhttp = new XDomainRequest();
			xmlhttp.onload = _ajaxComplete(xmlhttp, xmldocpath, completecallback, errorcallback);
			xmlhttp.onerror = _ajaxError(errorcallback, xmldocpath, xmlhttp);
		} else if (utils.exists(WINDOW.XMLHttpRequest)) {
			// Firefox, Chrome, Opera, Safari
			xmlhttp = new XMLHttpRequest();
			xmlhttp.onreadystatechange = _readyStateChangeHandler(xmlhttp, xmldocpath, completecallback, errorcallback);
			xmlhttp.onerror = _ajaxError(errorcallback, xmldocpath);
		} else {
			if (errorcallback) errorcallback();
		}
		 
		try {
			xmlhttp.open("GET", xmldocpath, true);
			xmlhttp.send(null);
		} catch (error) {
			if (errorcallback) errorcallback(xmldocpath);
		}
		return xmlhttp;
	};
	
	function _isCrossdomain(path) {
		if (path && path.indexOf("://") >= 0) {
			if (path.split("/")[2] != WINDOW.location.href.split("/")[2])
				return true
		} 
		return false;	
	}
	
	function _ajaxError(errorcallback, xmldocpath, xmlhttp) {
		return function() {
			errorcallback("Error loading file");
		}
 	}
	
	function _readyStateChangeHandler(xmlhttp, xmldocpath, completecallback, errorcallback) {
		return function() {
			if (xmlhttp.readyState === 4) {
				switch (xmlhttp.status) {
				case 200:
					_ajaxComplete(xmlhttp, xmldocpath, completecallback, errorcallback)();
					break;
				case 404:
					errorcallback("File not found");
				}
			}
		}
	}
	
	function _ajaxComplete(xmlhttp, xmldocpath, completecallback, errorcallback) {
		return function() {
			// Handle the case where an XML document was returned with an incorrect MIME type.
			if (!utils.exists(xmlhttp.responseXML)) {
				var parsedXML = utils.parseXML(xmlhttp.responseText);
				if (parsedXML) {
					xmlhttp = utils.extend({}, xmlhttp, {responseXML:parsedXML});
				} else {
					if (errorcallback) errorcallback(xmldocpath);
					return;
				}
			}
			completecallback(xmlhttp);
		}
	}
	
	/** Takes an XML string and returns an XML object **/
	utils.parseXML = function(input) {
		try {
			var parsedXML;
			// Parse XML in FF/Chrome/Safari/Opera
			if (WINDOW.DOMParser) {
				parsedXML = (new DOMParser()).parseFromString(input,"text/xml");
			} else { 
				// Internet Explorer
				parsedXML = new ActiveXObject("Microsoft.XMLDOM");
				parsedXML.async="false";
				parsedXML.loadXML(input);
			}
			return parsedXML;
		} catch(e) {
			return;
		}
	}

	/**
	 * Cleans up a css dimension (e.g. '420px') and returns an integer.
	 */
	utils.parseDimension = function(dimension) {
		if (typeof dimension == "string") {
			if (dimension === "") {
				return 0;
			} else if (dimension.lastIndexOf("%") > -1) {
				return dimension;
			} else {
				return parseInt(dimension.replace("px", ""), 10);
			}
		}
		return dimension;
	}

	/** Format the elapsed / remaining text. **/
	utils.timeFormat = function(sec) {
		if (sec > 0) {
			var str = Math.floor(sec / 60) < 10 ? "0" + Math.floor(sec / 60) + ":" : Math.floor(sec / 60) + ":";
			str += Math.floor(sec % 60) < 10 ? "0" + Math.floor(sec % 60) : Math.floor(sec % 60);
			return str;
		} else {
			return "00:00";
		}
	}

	/** Replacement for getBoundingClientRect, which isn't supported in iOS 3.1.2 **/
	utils.bounds = function(element) {
		try {
			return element.getBoundingClientRect();
		} catch (e) {
			return { 
				left: element.offsetLeft + DOCUMENT.body.scrollLeft, 
				top: element.offsetTop + DOCUMENT.body.scrollTop, 
				width: element.offsetWidth, 
				height: element.offsetHeight
			};
		}
	}
	
	utils.empty = function(element) {
		if (!element) return;
		while (element.childElementCount > 0) {
			element.removeChild(element.children[0]);
		}
	}

})(jwplayer.utils);/**
 * CSS utility methods for the JW Player.
 *
 * @author pablo
 * @version 6.0
 */
(function(utils) {
	var _styleSheets={},
		_styleSheet,
		_rules = {},
		exists = utils.exists;

	function _createStylesheet() {
		var styleSheet = document.createElement("style");
		styleSheet.type = "text/css";
		document.getElementsByTagName('head')[0].appendChild(styleSheet);
		return styleSheet;
	}
	
	utils.css = function(selector, styles, important) {
		if (!exists(important)) important = false;
		
		if (utils.isIE()) {
			if (!_styleSheet) {
				_styleSheet = _createStylesheet();
			}
		} else if (!_styleSheets[selector]) {
			_styleSheets[selector] = _createStylesheet();
		}

		if (!_rules[selector]) {
			_rules[selector] = {};
		}

		for (var style in styles) {
			var val = _styleValue(style, styles[style], important);
			if (exists(_rules[selector][style]) && !exists(val)) {
				delete _rules[selector][style];
			} else if (exists(val)) {
				_rules[selector][style] = val;
			}
		}

		// IE9 limits the number of style tags in the head, so we need to update the entire stylesheet each time
		if (utils.isIE()) {
			_updateAllStyles();
		} else {
			_updateStylesheet(selector, _styleSheets[selector]);
		}
	}
	
	function _styleValue(style, value, important) {
		if (typeof value === "undefined") {
			return undefined;
		} 
		
		var importantString = important ? " !important" : "";

		if (!isNaN(value)) {
			switch (style) {
			case "z-index":
			case "opacity":
				return value + importantString;
				break;
			default:
				if (style.match(/color/i)) {
					return "#" + utils.pad(value.toString(16).replace(/^0x/i,""), 6) + importantString;
				} else if (value === 0) {
					return 0 + importantString;
				} else {
					return Math.ceil(value) + "px" + importantString;
				}
				break;
			}
		} else {
			if (!!value.match(/png|gif|jpe?g/i) && value.indexOf('url') != 0) {
				return "url(" + value + ")";
			}
			return value + importantString;
		}
	}

	function _updateAllStyles() {
		var ruleText = "\n";
		for (var rule in _rules) {
			ruleText += _getRuleText(rule);
		}
		_styleSheet.innerHTML = ruleText;
	}
	
	function _updateStylesheet(selector, sheet) {
		if (sheet) {
			sheet.innerHTML = _getRuleText(selector);
		}
	}
	
	function _getRuleText(selector) {
		var ruleText = selector + "{\n";
		var styles = _rules[selector];
		for (var style in styles) {
			ruleText += "  "+style + ": " + styles[style] + ";\n";
		}
		ruleText += "}\n";
		return ruleText;
	}
	
	
	/**
	 * Removes all css elements which match a particular style
	 */
	utils.clearCss = function(filter) {
		for (var rule in _rules) {
			if (rule.indexOf(filter) >= 0) {
				delete _rules[rule];
			}
		}
		for (var selector in _styleSheets) {
			if (selector.indexOf(filter) >= 0) {
				_styleSheets[selector].innerHTML = '';
			}
		}
	}
	
	utils.transform = function(element, value) {
		var transform = "-transform", style;
		value = value ? value : "";
		if (typeof element == "string") {
			style = {};
			style['-webkit'+transform] = value;
			style['-ms'+transform] = value;
			style['-moz'+transform] = value;
			style['-o'+transform] = value;
			utils.css(element, style);
		} else {
			transform = "Transform";
			style = element.style;
			style['webkit'+transform] = value;
			style['Moz'+transform] = value;
			style['ms'+transform] = value;
			style['O'+transform] = value;
		}
	}
	
	utils.dragStyle = function(selector, style) {
		utils.css(selector, {
			'-webkit-user-select': style,
			'-moz-user-select': style,
			'-ms-user-select': style,
			'-webkit-user-drag': style,
			'user-select': style,
			'user-drag': style
		});
	}
	
	utils.transitionStyle = function(selector, style) {
		utils.css(selector, {
			'-webkit-transition': style,
			'-moz-transition': style,
			'-o-transition': style
		});
	}

	
	utils.rotate = function(domelement, deg) {
		utils.transform(domelement, "rotate(" + deg + "deg)");
	};
	
	utils.cssReset = function() {
		utils.css("div, span, a, img, ul, li, video", {
			margin: 0,
			padding: 0,
			border: 0,
			'font-size': "100%",
			font: 'inherit',
			'vertical-align': 'baseline'
		});
		
		utils.css("ul", { 'list-style': "none" });
	};

})(jwplayer.utils);/**
 * Utility methods for the JW Player.
 * 
 * @author pablo
 * @version 6.0
 */
(function(utils) {
	utils.scale = function(domelement, xscale, yscale, xoffset, yoffset) {
		var value, exists = utils.exists;
		
		// Set defaults
		if (!exists(xscale)) xscale = 1;
		if (!exists(yscale)) yscale = 1;
		if (!exists(xoffset)) xoffset = 0;
		if (!exists(yoffset)) yoffset = 0;
		
		if (xscale == 1 && yscale == 1 && xoffset == 0 && yoffset == 0) {
			value = "";
		} else {
			value = "scale("+xscale+","+yscale+") translate("+xoffset+"px,"+yoffset+"px)";
		}
		
		utils.transform(domelement, value);
		
	};
	
	/**
	 * Stretches domelement based on stretching. parentWidth, parentHeight,
	 * elementWidth, and elementHeight are required as the elements dimensions
	 * change as a result of the stretching. Hence, the original dimensions must
	 * always be supplied.
	 * 
	 * @param {String}
	 *            stretching
	 * @param {DOMElement}
	 *            domelement
	 * @param {Number}
	 *            parentWidth
	 * @param {Number}
	 *            parentHeight
	 * @param {Number}
	 *            elementWidth
	 * @param {Number}
	 *            elementHeight
	 */
	utils.stretch = function(stretching, domelement, parentWidth, parentHeight, elementWidth, elementHeight) {
		if (!domelement) return;
		if (!stretching) stretching = _stretching.UNIFORM;
		if (!parentWidth || !parentHeight || !elementWidth || !elementHeight) return;
		
		var xscale = parentWidth / elementWidth,
			yscale = parentHeight / elementHeight,
			xoff = 0, yoff = 0,
			style = {},
			video = (domelement.tagName.toLowerCase() == "video"),
			scale = false,
			stretchClass;
		
		if (video) {
			utils.transform(domelement);
		}

		stretchClass = "jw" + stretching.toLowerCase();
		
		switch (stretching.toLowerCase()) {
		case _stretching.FILL:
			if (xscale > yscale) {
				elementWidth = elementWidth * xscale;
				elementHeight = elementHeight * xscale;
			} else {
				elementWidth = elementWidth * yscale;
				elementHeight = elementHeight * yscale;
			}
		case _stretching.NONE:
			xscale = yscale = 1;
		case _stretching.EXACTFIT:
			scale = true;
			break;
		case _stretching.UNIFORM:
		default:
			if (xscale > yscale) {
				if (elementWidth * yscale / parentWidth > 0.95) {
					scale = true;
					stretchClass = "jwexactfit";
				} else {
					elementWidth = elementWidth * yscale;
					elementHeight = elementHeight * yscale;
				}
			} else {
				if (elementHeight * xscale / parentHeight > 0.95) {
					scale = true;
					stretchClass = "jwexactfit";
				} else {
					elementWidth = elementWidth * xscale;
					elementHeight = elementHeight * xscale;
				}
			}
			if (scale) {
				yscale = Math.ceil(100 * parentHeight / elementHeight) / 100;
				xscale = Math.ceil(100 * parentWidth / elementWidth) / 100;
			}
			break;
		}

		if (video) {
			if (scale && !utils.isMobile()) {
				domelement.style.width = elementWidth + "px";
				domelement.style.height = elementHeight + "px"; 
				xoff = ((parentWidth - elementWidth) / 2) / xscale;
				yoff = ((parentHeight - elementHeight) / 2) / yscale;
				utils.scale(domelement, xscale, yscale, xoff, yoff);
			} else {
				domelement.style.width = "";
				domelement.style.height = "";
			}
		} else {
			domelement.className = domelement.className.replace(/\s*jw(none|exactfit|uniform|fill)/g, "");
			domelement.className += " " + stretchClass;
		}
	};
	
	/** Stretching options **/
	var _stretching = utils.stretching = {
		NONE : "none",
		FILL : "fill",
		UNIFORM : "uniform",
		EXACTFIT : "exactfit"
	};

})(jwplayer.utils);
/**
 * Parsers namespace declaration
 * 
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	html5.parsers = {
		localName : function(node) {
			if (!node) {
				return "";
			} else if (node.localName) {
				return node.localName;
			} else if (node.baseName) {
				return node.baseName;
			} else {
				return "";
			}
		},
		textContent : function(node) {
			if (!node) {
				return "";
			} else if (node.textContent) {
				return node.textContent;
			} else if (node.text) {
				return node.text;
			} else {
				return "";
			}
		},
		getChildNode : function(parent, index) {
			return parent.childNodes[index];
		},
		numChildren : function(parent) {
			if (parent.childNodes) {
				return parent.childNodes.length;
			} else {
				return 0;
			}
		}

	};
})(jwplayer.html5);
/**
 * Parse a feed item for JWPlayer content.
 * 
 * @author zach
 * @modified pablo
 * @version 6.0
 */
(function(jwplayer) {
	var _parsers = jwplayer.html5.parsers;
	
	var jwparser = _parsers.jwparser = function() {
	};

	var PREFIX = 'jwplayer';

	/**
	 * Parse a feed entry for JWPlayer content.
	 * 
	 * @param {XML}
	 *            obj The XML object to parse.
	 * @param {Object}
	 *            itm The playlistentry to amend the object to.
	 * @return {Object} The playlistentry, amended with the JWPlayer info.
	 */
	jwparser.parseEntry = function(obj, itm) {
		for ( var i = 0; i < obj.childNodes.length; i++) {
			var node = obj.childNodes[i];
			if (node.prefix == PREFIX) {
				var _localName = _parsers.localName(node);
				itm[_localName] = jwplayer.utils.serialize(_parsers.textContent(node));
				if (_localName == "file" && itm.sources) {
					// jwplayer namespace file should override existing source
					// (probably set in MediaParser)
					delete itm.sources;
				}
			}
			if (!itm['file']) {
				itm['file'] = itm['link'];
			}
		}
		return itm;
	}
})(jwplayer);/**
 * Parse a MRSS group into a playlistitem (used in RSS and ATOM).
 *
 * author zach
 * modified pablo
 * version 6.0
 */
(function(parsers) {
	var utils = jwplayer.utils,
		_xmlAttribute = utils.xmlAttribute,
		_localName = parsers.localName,
		_textContent = parsers.textContent,
		_numChildren = parsers.numChildren;
	
	
	var mediaparser = parsers.mediaparser = function() {};
	
	/** Prefix for the MRSS namespace. **/
	var PREFIX = 'media';
	
	/**
	 * Parse a feeditem for Yahoo MediaRSS extensions.
	 * The 'content' and 'group' elements can nest other MediaRSS elements.
	 * @param	{XML}		obj		The entire MRSS XML object.
	 * @param	{Object}	itm		The playlistentry to amend the object to.
	 * @return	{Object}			The playlistentry, amended with the MRSS info.
	 **/
	mediaparser.parseGroup = function(obj, itm) {
		for (var i = 0; i < _numChildren(obj); i++) {
			var node = obj.childNodes[i];
			if (node.prefix == PREFIX) {
				if (!_localName(node)){
					continue;
				}
				switch (_localName(node).toLowerCase()) {
					case 'content':
						itm['file'] = _xmlAttribute(node, 'url');
						if (_xmlAttribute(node, 'duration')) {
							itm['duration'] = utils.seconds(_xmlAttribute(node, 'duration'));
						}
						if (_numChildren(node) > 0) {
							itm = mediaparser.parseGroup(node, itm);
						}
						if (_xmlAttribute(node, 'url')) {
							if (!itm.sources) {
								itm.sources = [];
							}
							itm.sources.push({
								file: _xmlAttribute(node, 'url'),
								type: _xmlAttribute(node, 'type'),
								width: _xmlAttribute(node, 'width'),
								label: _xmlAttribute(node, 'height') ? _xmlAttribute(node, 'height') + "p" : undefined
							});
						}
						break;
					case 'title':
						itm['title'] = _textContent(node);
						break;
					case 'description':
						itm['description'] = _textContent(node);
						break;
					case 'guid':
						itm['mediaid'] = _textContent(node);
						break;
					case 'thumbnail':
						itm['image'] = _xmlAttribute(node, 'url');
						break;
					case 'player':
						var url = node.url;
						break;
					case 'group':
						mediaparser.parseGroup(node, itm);
						break;
				}
			}
		}
		return itm;
	}
	
})(jwplayer.html5.parsers);
/**
 * Parse an RSS feed and translate it to a playlist.
 *
 * @author zach
 * @modified pablo
 * @version 6.0
 */
(function(parsers) {
	var utils = jwplayer.utils,
		_textContent = parsers.textContent,
		_getChildNode = parsers.getChildNode,
		_numChildren = parsers.numChildren,
		_localName = parsers.localName;
	
	parsers.rssparser = {};
	
	
	/**
	 * Parse an RSS playlist for feed items.
	 *
	 * @param {XML} dat
	 * @reuturn {Array} playlistarray
	 */
	parsers.rssparser.parse = function(dat) {
		var arr = [];
		for (var i = 0; i < _numChildren(dat); i++) {
			var node = _getChildNode(dat, i),
				localName = _localName(node).toLowerCase();
			if (localName == 'channel') {
				for (var j = 0; j < _numChildren(node); j++) {
					var subNode = _getChildNode(node, j);
					if (_localName(subNode).toLowerCase() == 'item') {
						arr.push(_parseItem(subNode));
					}
				}
			}
		}
		return arr;
	};
		
		
	/** 
	 * Translate RSS item to playlist item.
	 *
	 * @param {XML} obj
	 * @return {PlaylistItem} PlaylistItem
	 */
	function _parseItem(obj) {
		var itm = {};
		for (var i = 0; i < obj.childNodes.length; i++) {
			var node = obj.childNodes[i];
			var localName = _localName(node);
			if (!localName){
				continue;
			}
			switch (localName.toLowerCase()) {
				case 'enclosure':
					itm['file'] = utils.xmlAttribute(node, 'url');
					break;
				case 'title':
					itm['title'] = _textContent(node);
					break;
				case 'pubdate':
					itm['date'] = _textContent(node);
					break;
				case 'description':
					itm['description'] = _textContent(node);
					break;
				case 'link':
					itm['link'] = _textContent(node);
					break;
				case 'category':
					if (itm['tags']) {
						itm['tags'] += _textContent(node);
					} else {
						itm['tags'] = _textContent(node);
					}
					break;
			}
		}
		itm = parsers.mediaparser.parseGroup(obj, itm);
		itm = parsers.jwparser.parseEntry(obj, itm);

		return new jwplayer.playlist.item(itm);
	}


	
	
})(jwplayer.html5.parsers);
// TODO: blankButton
/**
 * JW Player HTML5 Controlbar component
 * 
 * @author pablo
 * @version 6.0
 */
(function(jwplayer) {
	
	var html5 = jwplayer.html5,
		utils = jwplayer.utils,
		events = jwplayer.events,
		states = events.state,
		_css = utils.css,
		_setTransition = utils.transitionStyle,

		/** Controlbar element types **/
		CB_BUTTON = "button",
		CB_TEXT = "text",
		CB_DIVIDER = "divider",
		CB_SLIDER = "slider",
		
		/** Some CSS constants we should use for minimization **/
		JW_CSS_RELATIVE = "relative",
		JW_CSS_ABSOLUTE = "absolute",
		JW_CSS_NONE = "none",
		JW_CSS_BLOCK = "block",
		JW_CSS_INLINE = "inline",
		JW_CSS_INLINE_BLOCK = "inline-block",
		JW_CSS_HIDDEN = "hidden",
		JW_CSS_LEFT = "left",
		JW_CSS_RIGHT = "right",
		JW_CSS_100PCT = "100%",
		JW_CSS_SMOOTH_EASE = "opacity .15s, background .15s, visibility .15s",
		
		CB_CLASS = '.jwcontrolbar',
		
		FALSE = false,
		TRUE = true,
		NULL = null,
		UNDEFINED = undefined,
		
		WINDOW = window,
		DOCUMENT = document;
	
	/** HTML5 Controlbar class **/
	html5.controlbar = function(api, config) {
		var _api,
			_skin,
			_dividerElement = _layoutElement("divider", CB_DIVIDER),
			_defaults = {
				margin : 10,
				maxwidth: 0,
				font : "Arial,sans-serif",
				fontsize : 10,
				fontcolor : parseInt("000000", 16),
				fontstyle : "normal",
				fontweight : "bold",
				layout : {
					left: {
						position: "left",
						elements: [ 
						   _layoutElement("play", CB_BUTTON), 
						   _dividerElement, 
						   _layoutElement("prev", CB_BUTTON), 
						   _layoutElement("next", CB_BUTTON), 
						   _dividerElement, 
						   _layoutElement("elapsed", CB_TEXT)
						]
					},
					center: {
						position: "center",
						elements: [ _layoutElement("time", CB_SLIDER) ]
					},
					right: {
						position: "right",
						elements: [ 
						    _layoutElement("duration", CB_TEXT), 
						    _dividerElement,
						    _layoutElement("hdOn", CB_BUTTON), 
						    //_layoutElement("ccOn", CB_BUTTON), 
						    _layoutElement("mute", CB_BUTTON), 
						    _layoutElement("volume", CB_SLIDER), 
						    _dividerElement,
						    _layoutElement("fullscreen", CB_BUTTON)
					    ]
					}
				}
			},
		
			_settings, 
			_layout, 
			_elements,
			_bgHeight,
			_controlbar, 
			_id,
			_duration,
			_position,
			_levels,
			_currentQuality,
			_currentVolume,
			_volumeOverlay,
			_timeOverlay,
			_timeOverlayText,
			_hdOverlay,
			_ccOverlay,
			_fullscreenOverlay,
			_audioMode = FALSE,
			_dragging = FALSE,
			_lastSeekTime = 0,
			
			_toggles = {
				play: "pause",
				mute: "unmute",
				fullscreen: "normalscreen",
				hdOn: "hdOff",
				ccOn: "ccOff"
			},
			
			_toggleStates = {
				play: FALSE,
				mute: FALSE,
				fullscreen: FALSE,
				hdOn: FALSE,
				ccOn: FALSE
			},
			
			_buttonMapping = {
				play: _play,
				mute: _mute,
				fullscreen: _fullscreen,
				next: _next,
				prev: _prev,
				hdOn: _hd,
				ccOn: _cc
			},
			
			_sliderMapping = {
				time: _seek,
				volume: _volume
			};
		
			_overlays = {};

		function _layoutElement(name, type) {
			return { name: name, type: type };
		}
		
		function _init() {
			_elements = {};
			
			_api = api;

			_id = _api.id + "_controlbar";
			_duration = _position = 0;

			_controlbar = _createSpan();
			_controlbar.id = _id;
			_controlbar.className = "jwcontrolbar";

			// Slider listeners
			WINDOW.addEventListener('mousemove', _sliderMouseEvent, FALSE);
			WINDOW.addEventListener('mouseup', _sliderMouseEvent, FALSE);

			_skin = _api.skin;
			
			_layout = _skin.getComponentLayout('controlbar');
			if (!_layout) _layout = _defaults.layout;
			utils.clearCss('#'+_id);
			_createStyles();
			_buildControlbar();
			_addEventListeners();
			setTimeout(function() {
				_volumeHandler();
				_muteHandler();
			}, 0);
			
			this.visible = false;
		}
		
		function _addEventListeners() {
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_TIME, _timeUpdated);
			_api.jwAddEventListener(events.JWPLAYER_PLAYER_STATE, _stateHandler);
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_MUTE, _muteHandler);
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_VOLUME, _volumeHandler);
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_BUFFER, _bufferHandler);
			_api.jwAddEventListener(events.JWPLAYER_FULLSCREEN, _fullscreenHandler);
			_api.jwAddEventListener(events.JWPLAYER_PLAYLIST_LOADED, _playlistHandler);
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_LEVELS, _qualityHandler);
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_LEVEL_CHANGED, _qualityLevelChanged);
		}
		
		function _timeUpdated(evt) {
			var refreshRequired = FALSE,
				timeString;
			
			if (_elements.elapsed) {
				timeString = utils.timeFormat(evt.position);
				_elements.elapsed.innerHTML = timeString;
				refreshRequired = (timeString.length != utils.timeFormat(_position).length);
			}
			if (_elements.duration) {
				timeString = utils.timeFormat(evt.duration);
				_elements.duration.innerHTML = timeString;
				refreshRequired = (refreshRequired || (timeString.length != utils.timeFormat(_duration).length));
			}
			if (evt.duration > 0) {
				_setProgress(evt.position / evt.duration);
			} else {
				_setProgress(0);
			}
			_duration = evt.duration;
			_position = evt.position;
			
			if (refreshRequired) _redraw();
		}
		
		function _stateHandler(evt) {
			switch (evt.newstate) {
			case states.BUFFERING:
			case states.PLAYING:
				_css(_internalSelector('.jwtimeSliderThumb'), { opacity: 1 });
				_toggleButton("play", TRUE);
				break;
			case states.PAUSED:
				if (!_dragging) {
					_toggleButton("play", FALSE);
				}
				break;
			case states.IDLE:
				_toggleButton("play", FALSE);
				_css(_internalSelector('.jwtimeSliderThumb'), { opacity: 0 });
				if (_elements["timeRail"]) {
					_elements["timeRail"].className = "jwrail";
					setTimeout(function() {
						// Temporarily disable the buffer animation
						_elements["timeRail"].className += " jwsmooth";
					}, 100);
				}
				_setBuffer(0);
				_timeUpdated({ position: 0, duration: 0});
				break;
			}
		}
		
		function _muteHandler() {
			var state = _api.jwGetMute();
			_toggleButton("mute", state);
			_setVolume(state ? 0 : _currentVolume)
 		}

		function _volumeHandler() {
			_currentVolume = _api.jwGetVolume() / 100;
			_setVolume(_currentVolume);
		}

		function _bufferHandler(evt) {
			_setBuffer(evt.bufferPercent / 100);
		}
		
		function _fullscreenHandler(evt) {
			_toggleButton("fullscreen", evt.fullscreen);
		}
		
		function _playlistHandler(evt) {
			var hidden = { display: JW_CSS_NONE },
				not_hidden = { display: UNDEFINED };
			if (_api.jwGetPlaylist().length < 2 || _sidebarShowing()) {
				_css(_internalSelector(".jwnext"), hidden);
				_css(_internalSelector(".jwprev"), hidden);
			} else {
				_css(_internalSelector(".jwnext"), not_hidden);
				_css(_internalSelector(".jwprev"), not_hidden);
			}
			_css(_internalSelector(".jwhdOn"), hidden);
			_css(_internalSelector(".jwhdOff"), hidden);
			_redraw();
		}
		
		function _qualityHandler(evt) {
			_levels = evt.levels;
			_qualityLevelChanged(evt);
			if (_levels && _levels.length > 1 && _hdOverlay) {
				_css(_internalSelector(".jwhdOn"), { display: UNDEFINED });
				_hdOverlay.clearOptions();
				for (var i=0; i<_levels.length; i++) {
					_hdOverlay.addOption(_levels[i].label, i);
				}
				if (_currentQuality >= 0) {
					_hdOverlay.setActive(evt.currentQuality);
				}
			} else {
				_css(_internalSelector(".jwhdOn"), { display: "none" });
			}
			_redraw();
		}
		
		function _qualityLevelChanged(evt) {
			_currentQuality = evt.currentQuality;
			if (_levels.length == 2) {
				_toggleButton("hdOn", _currentQuality == 0);
			}
		}
		
		// Bit of a hacky way to determine if the playlist is available 
		function _sidebarShowing() {
			return (!!DOCUMENT.querySelector("#"+_api.id+" .jwplaylist"));
		}

		/**
		 * Styles specific to this controlbar/skin
		 */
		function _createStyles() {
			_settings = utils.extend({}, _defaults, _skin.getComponentSettings('controlbar'), config);

			_bgHeight = _getSkinElement("background").height;
			
			_css('#'+_id, {
		  		height: _bgHeight,
		  		bottom: _audioMode ? 0 : _settings.margin
			});
			
			_css(_internalSelector(".jwtext"), {
				font: _settings.fontsize + "px/" + _getSkinElement("background").height + "px " + _settings.font,
				color: _settings.fontcolor,
				'font-weight': _settings.fontweight,
				'font-style': _settings.fontstyle,
				'text-align': 'center',
				padding: '0 5px'
			});

			_css(_internalSelector(".jwoverlay"), {
				bottom: _bgHeight
			});

			
			if (_settings.maxwidth > 0) {
				_css(_internalSelector(), {
					'max-width': _settings.maxwidth
				});
			}
		}

		
		function _internalSelector(name) {
			return '#' + _id + (name ? " " + name : "");
		}

		function _createSpan() {
			return _createElement("span");
		}
		
		function _createElement(tagname) {
			return DOCUMENT.createElement(tagname);
		}
		
		function _buildControlbar() {
			var capLeft = _buildImage("capLeft");
			var capRight = _buildImage("capRight");
			var bg = _buildImage("background", {
				position: JW_CSS_ABSOLUTE,
				left: _getSkinElement('capLeft').width,
				right: _getSkinElement('capRight').width,
				'background-repeat': "repeat-x"
			}, TRUE);

			if (bg) _appendChild(_controlbar, bg);
			if (capLeft) _appendChild(_controlbar, capLeft);
			_buildLayout();
			if (capRight) _appendChild(_controlbar, capRight);
		}
		
		function _buildElement(element) {
			switch (element.type) {
			case CB_DIVIDER:
				return _buildDivider(element);
				break;
			case CB_TEXT:
				return _buildText(element.name);
				break;
			case CB_BUTTON:
				if (element.name != "blank") {
					return _buildButton(element.name);
				}
				break;
			case CB_SLIDER:
				return _buildSlider(element.name);
				break;
			}
		}
		
		function _buildImage(name, style, stretch, nocenter, vertical) {
			var element = _createSpan();
			element.className = 'jw'+name;
			
			var center = nocenter ? " left center" : " center";

			var skinElem = _getSkinElement(name);
			element.innerHTML = "&nbsp;";
			if (!skinElem || skinElem.src == "") {
				return;
			}
			
			var newStyle;
			
			if (stretch) {
				newStyle = {
					background: "url('" + skinElem.src + "') repeat-x " + center,
					height: vertical ? skinElem.height : UNDEFINED 
				};
			} else {
				newStyle = {
					background: "url('" + skinElem.src + "') no-repeat" + center,
					width: skinElem.width,
					height: vertical ? skinElem.height : UNDEFINED 
				};
			}
			element.skin = skinElem;
			_css(_internalSelector('.jw'+name), utils.extend(newStyle, style));
			_elements[name] = element;
			return element;
		}

		function _buildButton(name) {
			if (!_getSkinElement(name + "Button").src) {
				return NULL;
			}
			
			var element = _createSpan();
			element.className = 'jw'+name + ' jwbuttoncontainer';
			var button = _createElement("button");
			button.addEventListener("click", _buttonClickHandler(name), FALSE);
			button.innerHTML = "&nbsp;";
			_appendChild(element, button);

			var outSkin = _getSkinElement(name + "Button");
			var overSkin = _getSkinElement(name + "ButtonOver");
			
			
			_buttonStyle(_internalSelector('.jw'+name+" button"), outSkin, overSkin);
			var toggle = _toggles[name];
			if (toggle) {
				_buttonStyle(_internalSelector('.jw'+name+'.jwtoggle button'), _getSkinElement(toggle+"Button"), _getSkinElement(toggle+"ButtonOver"));
			}

			_elements[name] = element;
			
			return element;
		}
		
		function _buttonStyle(selector, out, over) {
			if (!out.src) {
				return;
			}
			
			_css(selector, { 
				width: out.width,
				background: 'url('+ out.src +') center no-repeat'
			});
			
			if (over.src) {
				_css(selector + ':hover', { 
					background: 'url('+ over.src +') center no-repeat'
				});
			}
		}
		
		function _buttonClickHandler(name) {
			return function() {
				if (_buttonMapping[name]) {
					_buttonMapping[name]();
				}
			}
		}
		

		function _play() {
			if (_toggleStates.play) {
				_api.jwPause();
			} else {
				_api.jwPlay();
			}
		}
		
		function _mute() {
			_api.jwSetMute();
			_muteHandler({mute:_toggleStates.mute});
		}

		function _hideOverlays(exception) {
			for (var i in _overlays) {
				if (i != exception && _overlays.hasOwnProperty(i)) {
					_overlays[i].hide();
				}
			}
		}
		
		function _showVolume() {
			if (_audioMode) return;
			_volumeOverlay.show();
			_hideOverlays('volume');
		}
		
		function _volume(pct) {
			_setVolume(pct);
			if (pct < 0.1) pct = 0;
			if (pct > 0.9) pct = 1;
			_api.jwSetVolume(pct * 100);
		}
		
		function _showFullscreen() {
			if (_audioMode) return;
			_fullscreenOverlay.show();
			_hideOverlays('fullscreen');
		}
		
		function _seek(pct) {
			_api.jwSeek(pct * _duration);
		}
		
		function _fullscreen() {
			_api.jwSetFullscreen();
		}

		function _next() {
			_api.jwPlaylistNext();
		}

		function _prev() {
			_api.jwPlaylistNext();
		}

		function _toggleButton(name, state) {
			if (!utils.exists(state)) {
				state = !_toggleStates[name];
			}
			if (_elements[name]) {
				_elements[name].className = 'jw' + name + (state ? " jwtoggle jwtoggling" : " jwtoggling");
				// Use the jwtoggling class to temporarily disable the animation;
				setTimeout(function() {
					_elements[name].className = _elements[name].className.replace(" jwtoggling", ""); 
				}, 100);
			}
			_toggleStates[name] = state;
		}
		
		function _createElementId(name) {
			return _id + "_" + name;
		}
		
		function _buildText(name, style) {
			var element = _createSpan();
			element.id = _createElementId(name); 
			element.className = "jwtext jw" + name;
			
			var css = {};
			
			var skinElement = _getSkinElement(name+"Background");
			if (skinElement.src) {
				css.background = "url(" + skinElement.src + ") no-repeat center";
				css['background-size'] = "100% " + _getSkinElement("background").height + "px";
			}

			_css(_internalSelector('.jw'+name), css);
			element.innerHTML = "00:00";
			_elements[name] = element;
			return element;
		}
		
		function _buildDivider(divider) {
			if (divider.width) {
				var element = _createSpan();
				element.className = "jwblankDivider";
				_css(element, {
					width: parseInt(divider.width)
				});
				return element;
			} else if (divider.element) {
				return _buildImage(divider.element);
			} else {
				return _buildImage(divider.name);
			}
		}
		
		function _showHd() {
			if (_levels && _levels.length > 2) {
				_hdOverlay.show();
				_hideOverlays('hd');
			}
		}
		
		function _hd() {
			if (_levels && _levels.length == 2) {
				_api.jwSetCurrentQuality(_currentQuality ? 0 : 1);
			}
		}
		
		function _switchLevel(newlevel) {
			if (newlevel >= 0 && newlevel < _levels.length) {
				_api.jwSetCurrentQuality(newlevel);
				_hdOverlay.hide();
			}
		}
		
		function _cc() {
			_toggleButton("ccOn");
		}
		
		function _buildSlider(name) {
			var slider = _createSpan(),
				prefix = name + "SliderCap",
				vertical = !!_getSkinElement(prefix+"Bottom").src,
				left = vertical ? "Top" : "Left",
				right = vertical ? "Bottom" : "Right",
				capLeft = _buildImage(prefix + left, NULL, FALSE, FALSE, vertical),
				capRight = _buildImage(prefix + right, NULL, FALSE, FALSE, vertical),
				rail = _buildSliderRail(name, vertical, left, right),
				capLeftSkin = _getSkinElement(prefix+left),
				capRightSkin = _getSkinElement(prefix+left),
				railSkin = _getSkinElement(name+"SliderRail");
			
			slider.className = "jwslider jw" + name;
			
			if (capLeft) _appendChild(slider, capLeft);
			_appendChild(slider, rail);
			if (capRight) {
				if (vertical) capRight.className += " jwcapBottom";
				_appendChild(slider, capRight);
			}

			_css(_internalSelector(".jw" + name + " .jwrail"), {
				left: vertical ? UNDEFINED : capLeftSkin.width,
				right: vertical ? UNDEFINED : capRightSkin.width,
				top: vertical ? capLeftSkin.height : UNDEFINED,
				bottom: vertical ? capRightSkin.height : UNDEFINED,
				width: vertical ? JW_CSS_100PCT : UNDEFINED,
				height: vertical ? "auto" : UNDEFINED
			});

			_elements[name] = slider;
			slider.vertical = vertical;

			if (name == "time") {
				_timeOverlay = new html5.overlay(_id+"_timetooltip", _skin);
				_timeOverlayText = _createElement("div");
				_setTimeOverlay(0);
				_appendChild(rail, _timeOverlay.element());
				_styleTimeSlider(slider);
				_setProgress(0);
				_setBuffer(0);
			} else if (name == "volume") {
				_styleVolumeSlider(slider, vertical, left, right);
			}
			
			return slider;
		}
		
		function _buildSliderRail(name, vertical, left, right) {
			var rail = _createSpan(), 
				railElements = ['Rail', 'Buffer', 'Progress'],
				progressRail;
			
			rail.className = "jwrail jwsmooth";

			for (var i=0; i<railElements.length; i++) {
				var prefix = name + "Slider" + railElements[i],
					element = _buildImage(prefix, NULL, !vertical, (name=="volume")),
					capLeft = _buildImage(prefix + "Cap" + left, NULL, FALSE, FALSE, vertical),
					capRight = _buildImage(prefix + "Cap" + right, NULL, FALSE, FALSE, vertical),
					capLeftSkin = _getSkinElement(prefix + "Cap" + left),
					capRightSkin = _getSkinElement(prefix + "Cap" + right);
				if (element) {
					var railElement = _createSpan();
					railElement.className = "jwrailgroup " + railElements[i];
					if (capLeft) _appendChild(railElement, capLeft);
					_appendChild(railElement, element);
					if (capRight) { 
						_appendChild(railElement, capRight);
						capRight.className += " jwcap" + (vertical ? "Bottom" : "Right");
					}
					
					_css(_internalSelector(".jwrailgroup." + railElements[i]), {
						'min-width': (vertical ? UNDEFINED : capLeftSkin.width + capRightSkin.width)
					});
					railElement.capSize = vertical ? capLeftSkin.height + capRightSkin.height : capLeftSkin.width + capRightSkin.width;
					
					_css(_internalSelector("." + element.className), {
						left: vertical ? UNDEFINED : capLeftSkin.width,
						right: vertical ? UNDEFINED : capRightSkin.width,
						top: vertical ? capLeftSkin.height : UNDEFINED,
						bottom: vertical ? capRightSkin.height : UNDEFINED,
						height: vertical ? "auto" : UNDEFINED
					});

					if (i == 2) progressRail = railElement;
					
					_elements[prefix] = railElement;
					_appendChild(rail, railElement);
				}
			}
			
			var thumb = _buildImage(name + "SliderThumb", NULL, FALSE, FALSE, vertical);
			if (thumb) {
				_css(_internalSelector('.'+thumb.className), {
					opacity: name == "time" ? 0 : 1,
					'margin-top': vertical ? thumb.skin.height / -2 : UNDEFINED
				});
				
				thumb.className += " jwthumb";
				_appendChild(vertical && progressRail ? progressRail : rail, thumb);
			}
			
			rail.addEventListener('mousedown', _sliderMouseDown(name), FALSE);
			
			if (name == "time") {
				rail.addEventListener('mousemove', _showTimeTooltip, FALSE);
				rail.addEventListener('mouseout', _hideTimeTooltip, FALSE);
			}
			
			_elements[name+'Rail'] = rail;
			
			return rail;
		}
		
		function _idle() {
			var currentState = _api.jwGetState();
			return (currentState == states.IDLE); 
		}

		function _sliderMouseDown(name) {
			return (function(evt) {
				if (evt.button != 0)
					return;
				
				_elements[name+'Rail'].className = "jwrail";
				
				if (name == "time") {
					if (!_idle()) {
						_api.jwSeekDrag(TRUE);
						_dragging = name;
					}
				} else {
					_dragging = name;
				}
			});
		}
		
		function _sliderMouseEvent(evt) {
			_positionTimeTooltip(evt);
			
			if (!_dragging || evt.button != 0) {
				return;
			}
			
			var rail = _elements[_dragging].getElementsByClassName('jwrail')[0],
				railRect = utils.bounds(rail),
				name = _dragging,
				pct = _elements[name].vertical ? (railRect.bottom - evt.clientY) / railRect.height : (evt.clientX - railRect.left) / railRect.width;
			
			if (evt.type == 'mouseup') {
				if (name == "time") {
					_api.jwSeekDrag(FALSE);
				}

				_elements[name+'Rail'].className = "jwrail jwsmooth";
				_dragging = NULL;
				_sliderMapping[name](pct);
			} else {
				if (_dragging == "time") {
					_setProgress(pct);
				} else {
					_setVolume(pct);
				}
				var currentTime = (new Date()).getTime();
				if (currentTime - _lastSeekTime > 500) {
					_lastSeekTime = currentTime;
					_sliderMapping[_dragging](pct);
				}
			}
		}

		function _showTimeTooltip(evt) {
			if (_timeOverlay && _duration && !_audioMode) {
				_timeOverlay.show();
			}
		}
		
		function _hideTimeTooltip(evt) {
			if (_timeOverlay) {
				_timeOverlay.hide();
			}
		}
		
		function _positionTimeTooltip(evt) {
			var element = _timeOverlay.element(), 
				railBox = utils.bounds(element.parentNode),
				position = (evt.pageX - railBox.left) - WINDOW.pageXOffset;
			if (position >= 0 && position <= railBox.width) {
				element.style.left = position + "px";
				_setTimeOverlay(_duration * position / railBox.width);
			}
		}
		
		function _setTimeOverlay(sec) {
			_timeOverlayText.innerHTML = utils.timeFormat(sec);
			_timeOverlay.setContents(_timeOverlayText);
		}
		
		function _styleTimeSlider(slider) {
			if (_elements['timeSliderThumb']) {
				_css(_internalSelector(".jwtimeSliderThumb"), {
					'margin-left': (_getSkinElement("timeSliderThumb").width/-2)
				});
			}

			_setBuffer(0);
			_setProgress(0);
		}
		
		
		function _styleVolumeSlider(slider, vertical, left, right) {
			var prefix = "volumeSlider";
			_css(_internalSelector(".jwvolume"), {
				width: _getSkinElement(prefix+"Rail").width + (vertical ? 0 : _getSkinElement(prefix+"Cap"+left).width + _getSkinElement(prefix+"Cap"+right).width),
				height: vertical ? (
							_getSkinElement(prefix+"Cap"+left).height + 
							_getSkinElement(prefix+"Rail").height + 
							_getSkinElement(prefix+"RailCap"+left).height + 
							_getSkinElement(prefix+"RailCap"+right).height + 
							_getSkinElement(prefix+"Cap"+right).height
						) : UNDEFINED
			});
			if (vertical) slider.className += " jwvertical";
		}
		
		var _groups = {};
		
		function _buildLayout() {
			_buildGroup("left");
			_buildGroup("center");
			_buildGroup("right");
			_appendChild(_controlbar, _groups.left);
			_appendChild(_controlbar, _groups.center);
			_appendChild(_controlbar, _groups.right);
			_buildOverlays();
			
			_css(_internalSelector(".jwright"), {
				right: _getSkinElement("capRight").width
			});
		}

		function _buildOverlays() {
			if (_elements.hdOn) {
				_hdOverlay = new html5.menu('hd', _id+"_hd", _skin, _switchLevel);
				_addOverlay(_hdOverlay, _elements.hdOn, _showHd);
				_overlays.hd = _hdOverlay;
			}
			if (_elements.mute && _elements.volume && _elements.volume.vertical) {
				_volumeOverlay = new html5.overlay(_id+"_volumeoverlay", _skin);
				_volumeOverlay.setContents(_elements.volume);
				_addOverlay(_volumeOverlay, _elements.mute, _showVolume);
				_overlays.volume = _volumeOverlay;
			}
			if (_elements.fullscreen) {
				_fullscreenOverlay = new html5.overlay(_id+"_fullscreenoverlay", _skin);
				var text = _createElement("div");
				text.innerHTML = "Fullscreen";
				_fullscreenOverlay.setContents(text);
				_addOverlay(_fullscreenOverlay, _elements.fullscreen, _showFullscreen);
				_overlays.fullscreen = _fullscreenOverlay;
 			}
		}
		
		function _addOverlay(overlay, button, hoverAction) {
			var element = overlay.element();
			_appendChild(button, element);
			button.addEventListener('mousemove', hoverAction, FALSE);
			button.addEventListener('mouseout', overlay.hide, FALSE);
			_css('#'+element.id, {
				left: "50%"
			});
		}
		
		function _buildGroup(pos) {
			var elem = _createSpan();
			elem.className = "jwgroup jw" + pos;
			_groups[pos] = elem;
			if (_layout[pos]) {
				_buildElements(_layout[pos], _groups[pos]);
			}
		}
		
		function _buildElements(group, container) {
			if (group && group.elements.length > 0) {
				for (var i=0; i<group.elements.length; i++) {
					var element = _buildElement(group.elements[i]);
					if (element) {
						if (group.elements[i].name == "volume" && element.vertical) {
							_volumeOverlay = new html5.overlay(_id+"_volumeOverlay", _skin);
							_volumeOverlay.setContents(element);
						} else {
							_appendChild(container, element);
						}
					}
				}
			}
		}

		var _redraw = this.redraw = function() {
			_createStyles();
			var capLeft = _getSkinElement("capLeft"), capRight = _getSkinElement("capRight")
			_css(_internalSelector('.jwgroup.jwcenter'), {
				left: Math.round(utils.parseDimension(_groups.left.offsetWidth) + capLeft.width),
				right: Math.round(utils.parseDimension(_groups.right.offsetWidth) + capRight.width)
			});
			
			var max = (_controlbar.parentNode.clientWidth > _settings.maxwidth), 
				margin = _audioMode ? 0 : _settings.margin;
			
			_css(_internalSelector(), {
				left:  max ? "50%" : margin,
				right:  max ? UNDEFINED : margin,
				'margin-left': max ? _controlbar.clientWidth / -2 : UNDEFINED,
				width: max ? JW_CSS_100PCT : UNDEFINED
			});
		
			_positionOverlays();
			
		}
		
		function _positionOverlays() {
			var cbBounds = utils.bounds(_controlbar),
				overlayBounds, i, overlay;
			for (i in _overlays) {
				overlay = _overlays[i];
				overlay.offsetX(0);
				overlayBounds = utils.bounds(overlay.element());
				if (overlayBounds.right > cbBounds.right) {
					overlay.offsetX(cbBounds.right - overlayBounds.right);
				} else if (overlayBounds.left < cbBounds.left) {
					overlay.offsetX(cbBounds.left - overlayBounds.left);
				}
			}
		}

		

		this.audioMode = function(mode) {
			if (mode != _audioMode) {
				_audioMode = mode;
				_css(_internalSelector(".jwfullscreen"), { display: mode ? JW_CSS_NONE : UNDEFINED });
				_css(_internalSelector(".jwhdOn"), { display: mode ? JW_CSS_NONE : UNDEFINED });
				_css(_internalSelector(".jwccOn"), { display: mode ? JW_CSS_NONE : UNDEFINED });
				_redraw();
			}
		}
		
		this.element = function() {
			return _controlbar;
		};

		this.margin = function() {
			return parseInt(_settings.margin);
		};

		function _setBuffer(pct) {
			pct = Math.min(Math.max(0, pct), 1);
			if (_elements.timeSliderBuffer) {
				_elements.timeSliderBuffer.style.width = pct * 100 + "%";
				_elements.timeSliderBuffer.style.opacity = pct > 0 ? 1 : 0;
			}
		}

		function _sliderPercent(name, pct) {
			var vertical = _elements[name].vertical,
				size = 100 * Math.min(Math.max(0, pct), 1) + "%",
				progress = _elements[name+'SliderProgress'],
				thumb = _elements[name+'SliderThumb'],
				hide = FALSE;
			
			// Set style directly on the elements; Using the stylesheets results in some flickering in Chrome.
			if (progress) {
				if (vertical) {
					progress.style.height = size;
					progress.style.bottom = 0;
					if (progress.clientHeight <= progress.capSize) hide = TRUE;
				} else {
					progress.style.width = size;
					if (progress.clientWidth <= progress.capSize) hide = TRUE;
				}
				progress.style.opacity = ((!hide && pct > 0) || _dragging) ? 1 : 0;
				
			}
			
			if (thumb) {
				if (vertical) {
					thumb.style.top = 0;
				} else {
					thumb.style.left = size;
				}
			}
		}
		
		function _setVolume (pct) {
			_sliderPercent('volume', pct);	
		}

		function _setProgress(pct) {
			_sliderPercent('time', pct);
		}

		function _getSkinElement(name) {
			var elem = _skin.getSkinElement('controlbar', name); 
			if (elem) {
				return elem;
			} else {
				return {
					width: 0,
					height: 0,
					src: "",
					image: UNDEFINED,
					ready: FALSE
				}
			}
		}
		
		function _appendChild(parent, child) {
			parent.appendChild(child);
		}
		
		this.show = function() {
			this.visible = true;
			_css(_internalSelector(), { opacity: 1, visibility: "visible" });
		}
		
		this.hide = function() {
			this.visible = false;
			_css(_internalSelector(), { opacity: 0, visibility: JW_CSS_HIDDEN });
		}
		
		// Call constructor
		_init();

	}

	/*************************************************************
	 * Player stylesheets - done once on script initialization;  *
	 * These CSS rules are used for all JW Player instances      *
	 *************************************************************/

	_css(CB_CLASS, {
		position: JW_CSS_ABSOLUTE,
		visibility: JW_CSS_HIDDEN,
		opacity: 0
	});
	
	_css(CB_CLASS+' span', {
		height: JW_CSS_100PCT
	});
	utils.dragStyle(CB_CLASS+' span', JW_CSS_NONE);
	
    _css(CB_CLASS+' .jwgroup', {
    	display: JW_CSS_INLINE
    });
    
    _css(CB_CLASS+' span, '+CB_CLASS+' .jwgroup button,'+CB_CLASS+' .jwleft', {
    	position: JW_CSS_RELATIVE,
		'float': JW_CSS_LEFT
    });
    
	_css(CB_CLASS+' .jwright', {
		position: JW_CSS_ABSOLUTE
	});
	
    _css(CB_CLASS+' .jwcenter', {
    	position: JW_CSS_ABSOLUTE
    });
    
    _css(CB_CLASS+' buttoncontainer,'+CB_CLASS+' button', {
    	display: JW_CSS_INLINE_BLOCK,
    	height: JW_CSS_100PCT,
    	border: JW_CSS_NONE,
    	cursor: 'pointer'
    });

    _css(CB_CLASS+' .jwcapRight,'+CB_CLASS+' .jwtimeSliderCapRight,'+CB_CLASS+' .jwvolumeSliderCapRight', { 
		right: 0,
		position: JW_CSS_ABSOLUTE
	});

    _css(CB_CLASS+' .jwcapBottom', { 
		bottom: 0,
    	position: JW_CSS_ABSOLUTE
	});

    _css(CB_CLASS+' .jwtime', {
    	position: JW_CSS_ABSOLUTE,
    	height: JW_CSS_100PCT,
    	width: JW_CSS_100PCT,
    	left: 0
    });
    
    _css(CB_CLASS + ' .jwthumb', {
    	position: JW_CSS_ABSOLUTE,
    	height: JW_CSS_100PCT,
    	cursor: 'pointer'
    });
    
    _css(CB_CLASS + ' .jwrail', {
    	position: JW_CSS_ABSOLUTE,
    	cursor: 'pointer'
    });

    _css(CB_CLASS + ' .jwrailgroup', {
    	position: JW_CSS_ABSOLUTE,
    	width: JW_CSS_100PCT
    });

    _css(CB_CLASS + ' .jwrailgroup span', {
    	position: JW_CSS_ABSOLUTE
    });

    _css(CB_CLASS + ' .jwdivider+.jwdivider', {
    	display: JW_CSS_NONE
    });
    
    _css(CB_CLASS + ' .jwtext', {
		padding: '0 5px',
		'text-align': 'center'
	});
    
    _css(CB_CLASS + ' .jwvertical *', {
    	display: JW_CSS_BLOCK,
    });

	_setTransition(CB_CLASS, JW_CSS_SMOOTH_EASE);
	_setTransition(CB_CLASS + ' button', JW_CSS_SMOOTH_EASE);
	_setTransition(CB_CLASS + ' .jwtime .jwsmooth span', JW_CSS_SMOOTH_EASE + ", width .25s linear, left .25s linear");
	_setTransition(CB_CLASS + ' .jwtoggling', JW_CSS_NONE);

})(jwplayer);/**
 * jwplayer.html5 API
 *
 * @author pablo
 * @version 6.0
 */
(function(jwplayer) {
	var html5 = jwplayer.html5,
		utils = jwplayer.utils, 
		events = jwplayer.events, 
		states = events.state;
		
	html5.controller = function(model, view) {
		var _model = model,
			_view = view,
			_video = model.getVideo(),
			_controller = this,
			_eventDispatcher = new events.eventdispatcher(_model.id, _model.config.debug),
			_ready = false,
			_queuedCalls = [];
		
		utils.extend(this, _eventDispatcher);

		function _init() {
			_model.addEventListener(events.JWPLAYER_MEDIA_BUFFER_FULL, _bufferFullHandler);
			_model.addEventListener(events.JWPLAYER_MEDIA_COMPLETE, function(evt) {
				// Insert a small delay here so that other complete handlers can execute
				setTimeout(_completeHandler, 25);
			});
		}
		
		function _playerReady(evt) {
			if (!_ready) {
				_ready = true;
				
				_view.completeSetup();
				_eventDispatcher.sendEvent(evt.type, evt);

				if (jwplayer.utils.exists(window.playerReady)) {
					playerReady(evt);
				}

				_eventDispatcher.sendEvent(jwplayer.events.JWPLAYER_PLAYLIST_LOADED, {playlist: _model.playlist});
				_eventDispatcher.sendEvent(jwplayer.events.JWPLAYER_PLAYLIST_ITEM, {index: _model.item});
				
				_model.addGlobalListener(_forward);
				_view.addGlobalListener(_forward);
				
				_load();
				
				if (_model.autostart && !utils.isIOS()) {
					_play();
				}
				
				while (_queuedCalls.length > 0) {
					var queuedCall = _queuedCalls.shift();
					_callMethod(queuedCall.method, queuedCall.arguments);
				}

			}
		}

		
		function _forward(evt) {
			_eventDispatcher.sendEvent(evt.type, evt);
		}
		
		function _bufferFullHandler(evt) {
			_video.play();
		}

		function _load(item) {
			_stop();
			
			switch (utils.typeOf(item)) {
			case "string":
				_model.setPlaylist(new jwplayer.playlist({file:item}));
				_model.setItem(0);
				break;
			case "object":
			case "array":
				_model.setPlaylist(new jwplayer.playlist(item));
				_model.setItem(0);
				break;
			case "number":
				_model.setItem(item);
				break;
			}
		}
		
		var _preplay, _actionOnAttach, _interruptPlay;
		
		function _play() {
			try {
				_actionOnAttach = _play;
				if (!_preplay) {
					_preplay = true;
					_eventDispatcher.sendEvent(events.JWPLAYER_MEDIA_BEFOREPLAY);
					_preplay = false;
					if (_interruptPlay) {
						_interruptPlay = false;
						_actionOnAttach = null;
						return;
					}
				}
				
				if (_isIdle()) {
					_video.load(_model.playlist[_model.item]);
				} else if (_model.state == states.PAUSED) {
					_video.play();
				}
				
				return true;
			} catch (err) {
				_eventDispatcher.sendEvent(events.JWPLAYER_ERROR, err);
				_actionOnAttach = null;
			}
			return false;
		}

		function _stop() {
			_actionOnAttach = null;
			try {
				if (!_isIdle()) {
					_video.stop();
				}
				if (_preplay) {
					_interruptPlay = true;
				}
				return true;
			} catch (err) {
				_eventDispatcher.sendEvent(events.JWPLAYER_ERROR, err);
			}
			return false;

		}

		function _pause() {
			try {
				switch (_model.state) {
					case states.PLAYING:
					case states.BUFFERING:
						_video.pause();
						break;
					default:
						if (_preplay) {
							_interruptPlay = true;
						}
				}
				return true;
			} catch (err) {
				_eventDispatcher.sendEvent(events.JWPLAYER_ERROR, err);
			}
			return false;

			
			if (_model.state == states.PLAYING || _model.state == states.BUFFERING) {
				_video.pause();
			}
		}
		
		function _isIdle() {
			return (_model.state == states.IDLE);
		}
		
		function _seek(pos) {
			_video.seek(pos);
		}
		
		function _setFullscreen(state) {
			_view.fullscreen(state);
		}

		function _setStretching(stretching) {
			_model.stretching = stretching;
			// TODO: Send stretching event
			_view.resize();
		}

		function _item(index) {
			_load(index);
			_play();
		}
		
		function _prev() {
			_item(_model.item - 1);
		}
		
		function _next() {
			_item(_model.item + 1);
		}
		
		function _completeHandler() {
			if (!_isIdle()) {
				// Something has made an API call before the complete handler has fired.
				return;
			}
			_actionOnAttach = _completeHandler;
			switch (_model.repeat.toLowerCase()) {
				case "single":
					_play();
					break;
				case "always":
					_next();
					break;
				case "list":
					if (_model.item == _model.playlist.length - 1) {
						_load(0);
						setTimeout(function() { _eventDispatcher.sendEvent(events.JWPLAYER_PLAYLIST_COMPLETE)}, 0);
					} else {
						_next();
					}
					break;
				default:
					setTimeout(function() { _eventDispatcher.sendEvent(events.JWPLAYER_PLAYLIST_COMPLETE)}, 0);
//					_stop();
					break;
			}
		}
		
		function _setCurrentQuality(quality) {
			_video.setCurrentQuality(quality);
		}

		function _getCurrentQuality() {
			if (_video) return _video.getCurrentQuality();
			else return -1;
		}

		function _getQualityLevels() {
			if (_video) return _video.getQualityLevels();
			else return null;
		}

		/** Used for the InStream API **/
		function _detachMedia() {
			try {
				return _model.getVideo().detachMedia();
			} catch (err) {
				return null;
			}
		}

		function _attachMedia() {
			try {
				var ret = _model.getVideo().attachMedia();
				if (typeof _actionOnAttach == "function") {
					_actionOnAttach();
				}
			} catch (err) {
				return null;
			}
		}
		
		function _waitForReady(func) {
			return function() {
				if (_ready) {
					_callMethod(func, arguments);
				} else {
					_queuedCalls.push({ method: func, arguments: arguments});
				}
			}
		}
		
		function _callMethod(func, args) {
			var _args = [];
			for (i=0; i < args.length; i++) {
				_args.push(args[i]);
			}
			func.apply(this, _args);
		}

		/** Controller API / public methods **/
		this.play = _waitForReady(_play);
		this.pause = _waitForReady(_pause);
		this.seek = _waitForReady(_seek);
		this.stop = _waitForReady(_stop);
		this.load = _waitForReady(_load);
		this.next = _waitForReady(_next);
		this.prev = _waitForReady(_prev);
		this.item = _waitForReady(_item);
		this.setVolume = _waitForReady(_model.setVolume);
		this.setMute = _waitForReady(_model.setMute);
		this.setFullscreen = _waitForReady(_setFullscreen);
		this.setStretching = _waitForReady(_setStretching);
		this.detachMedia = _detachMedia; 
		this.attachMedia = _attachMedia;
		this.setCurrentQuality = _waitForReady(_setCurrentQuality);
		this.getCurrentQuality = _getCurrentQuality;
		this.getQualityLevels = _getQualityLevels;
		
		this.playerReady = _playerReady;

		_init();
	}
	
})(jwplayer);

/**
 * JW Player Default skin
 *
 * @author zach
 * @version 5.8
 */
(function(jwplayer) {
	jwplayer.html5.defaultskin = function() {
		this.text = '<?xml version="1.0" ?><skin author="LongTail Video" name="Six" version="2.0"><components><component name="controlbar"><settings><setting name="margin" value="6"/><setting name="fontcase" value="normal"/><setting name="fontcolor" value="0xEEEEEE"/><setting name="fontsize" value="11"/><setting name="fontweight" value="bold"/><setting name="maxwidth" value="800"/></settings><elements><element name="background" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAcCAYAAACptnW2AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAACpJREFUKM9j/P//vwYDGmA0MjL6jy7IAlTJMFQFmRiwgCHto4EVZMSWbAB3n0/9zU8mKQAAAABJRU5ErkJggg=="/><element name="capLeft" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAcCAYAAABCgc61AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAIpJREFUKM9j/P//PxsDAwMXEPMBMQcQMwExAwsQcwOxVENDQ8iePXuyvn//LgaT4K2vrw/ZvHlzAwMSAElw7N69OwtoJAO6BNO3b9/EGNAASIIBXfWASzAx4ACD07mDNxD/cXJyvgJJImOQxA9vb+9p6BIgQhCItQsKCupVVFReSklJ/QdhRlxJFAD2ZXlmdH7XbQAAAABJRU5ErkJggg=="/><element name="capRight" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAcCAYAAABCgc61AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAIhJREFUKM9j+f//vwYDBPwD4h9A/AmIv7EYGxtfB4lycnK+cnFxmdbQ0LAGyH3GAtQBVv7t2zexTZs2NYD4jY2N8+ESMLB79+4soMRyDAmQTiDFhCEBAwMrwYADDFLnDg0JLi6uV6A0hiHh7e09DZTw4BIglT4+PtP6+vpACe4zy9OnTzWxJVEAtc55d5+eUPAAAAAASUVORK5CYII="/><element name="divider" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAcCAYAAACgXdXMAAAADElEQVQIHWNgGDwAAACMAAEQ1BAgAAAAAElFTkSuQmCC"/><element name="playButton" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAcCAYAAAB75n/uAAAAdUlEQVR42u2TsQ3AIAwE2YARMkJGyCiMwiiMwgjUFMAIjOC8lMJdiIjd+aSrr3i9MwzjHXoYMOgFmAIvvQCT4aEXYNLvEK2ZMEKvFODQVqC1Rl/sve8Faq20cMIIvUYgQR5ZMJDh6RixQIF8NMHAgMEZhrHNDU+1T3s3o0CaAAAAAElFTkSuQmCC"/><element name="playButtonOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAcCAYAAAB75n/uAAABhUlEQVR42uXVzUoCYRTGcXNGR3HSDPtASyIhrIjaFJlBRBRUdAUGQQurdVfSrl2LuhEvYxR1IYroRhCEWU1/4R2Yxcz4MUlQB34bGc6D58y8r+/vl2EYczNpKvitzN9/orEEGUEoQhAyJDNs2gAJCiKIYVGIQUUIAWvQNM2jWMEGtoRNpJBAFOGJgsRDAahYRRbHuMAVznGEHaSxZBNkvyPLQhXEkUEew+riE88o4AYn2BVBCcxDgWz+G6fxhLGMPdzBWh184RUPuEUOWaSwgBBkpwAZESRxiALsqoV3EXSPSxwgLUIUc1xOAWvI4RFupeENRVxjH0moCMBvF6BiHXkUMap0lPCCM2QQh2LuwingFE8Ytwa4wTYSCEEaGVCtVo1x1Gq1CQPEiDRNM9yUy2W92WyWdF13HJHrkt2aNxoNbTAYuC555Gtq17her7f6/f7HmK+p+4dmbcysO71ez8OHZnNUDBtXKpVuu932clTM/rCb/XHt/cL5/SvT+6XvKcz3r+sbpPMfjCOvfIMAAAAASUVORK5CYII="/><element name="pauseButton" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAcCAYAAAB75n/uAAAAN0lEQVR42u3NoQ0AMAwDwe6/YYBncWlUyQFBBX+SickfADM/0k+AQCbJffHfqir3hZ/ADwEAowtQ1mmQzb8rQgAAAABJRU5ErkJggg=="/><element name="pauseButtonOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAcCAYAAAB75n/uAAABdUlEQVR42t2WzWrCQBSFq1FSaSjaFi1iF6UFtdBdF6WhC0Hoym3BlSAu+wbddSF9xfyTJ7k9gRMJuY2Oi2w88BG5zLlHZiYzOTttiUijyP768Y2bxCKVv0nD+B/T2AY2OAcdPnOKNZtjrdx/KMCi6QJ0wTW44fOKFGtdjrXzEJPml2AA7sEEPIExeCRj1iYcM6CnOoTz2AYOuAVT8Arm4APMwDuZsTbnmCk9Dns0qxbVBj3wAFzR+iRlufT02IOLrqenA/rgGSxE64uUtaCnzx7WfwEtLtYQvIClaH2Tspb0DNmjtS9gxHldidYPKWtFz+hQgAPuwBtYi9aWlLXOPPQ6JgEu2IjWLylrQ89xAVEUSRzHkiSJpGm6C8jqBVSA8RR5nie+70sQBHmjbUZWL6CmyHiRVQAXWQfoRTbapiqA21QH6G1q9KJl5jwkDMPdi6YCzF40fVSoAB4VKqDiqKj1sKv9uK71wqn9yqzt0q/vs+Wk9QeSkdKwXIKzCgAAAABJRU5ErkJggg=="/><element name="prevButton" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAcCAYAAABsxO8nAAAAfUlEQVR42u2MwQnAIAxFu4EjOIIjOFJH6EiCF8fw7BQZwf5AegkU2tje8uGR5Afe5vH8mTHGZG5+EXSzSPoMCEyzCPd+9SYRZgCFb7MIJNB5XxURT7OotTYFkql5Jqq1TiGBzrvinUj2AMqSSHXHikj3GZBVpH8R9M3j+Tgn8lcGnlSSd08AAAAASUVORK5CYII="/><element name="prevButtonOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAcCAYAAABsxO8nAAABhUlEQVR42uXUz0oCURTH8VKz/BNFmZJ/iMAoEmohlRRI7Yp2Qa0igyJc9Qot2vUGbnwB3yJXPYKaCi5m62LQzSymr3KE09hAi1nVgQ93hnv4wZ259878o7Jte/YXfADPcAvwIeDgFwHMKYFJoDPILw0hREQYCyKMKBZlDCEIvzMkiAhWEEdCxlURRwoZJBGTwOA4SC0nLJMb2MGujFlsIYc8DrCPrIRHZtR3mccSMtI0qTMUcYoLXKGMTxxiE8t6WSHEsI2iCirhDg94RgVDmTtHDmvjILWsBPZwqYJe8Io3vEPXDfJY10ERJGXiWjVXUYMBZ5VQQMoZlMIRblVzHSZ+qkccI62DokijgHvVbMGtnnCCjGtQu922R7rdriXPU3SQ69IajYY9MhgM6p1Ox5R3zbE0l4+tmquWZdV6vZ7hDNIf2/X3T5r17zcM40MH6d/vuiGleWpD9vv9SrPZHDLn2JAuR0QFTR0R0zTLrVbr2xHx7NB6do14drF5dtV6c/n/7foCpva8IJ04vWUAAAAASUVORK5CYII="/><element name="nextButton" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAcCAYAAABsxO8nAAAAdklEQVR42u3OwQnAIAyF4WzgCB3BERypI3QkwYtjeHaKjGBfIeClFmvaWx58KAg/ks329WqtBbbBW7vMhhowBH2o2/WhLoJTh0QBrw4JfhXKObcBlnMulFJqNwp4uS+HIjjCNKGDZKshhkCYJlRge/ot2Ww/7gSJGQaejWvrvwAAAABJRU5ErkJggg=="/><element name="nextButtonOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAcCAYAAABsxO8nAAABjElEQVR42uXUPUvDQBwGcNvUatOK4kuKfUEERVGwg/iCguimuAk6iQqKOPkVHLr5DVz8An4LO/kR2jQtZMjaIbRLhvOpPOHOJMahnfQPP5IcyXO5S+5G/ngJIRKUpMRvwiEyIAWjPl5rlApIhgJ5YxoykIMJHnUYJx2ylGFHWjAozQdnoQBlKIIBM2RAnsdpBqa/hbHRgCWowBZswjoss30V1nhcYKe6P0w/aAoWYRua8ABncAKHcABHQlaFbz0JY/589YPm2Psxb+zBCzzCLVzBtWAxeIVvlQHND5rnUC5ArXd4hio8Ke2nsAF5OTwEcWJ32WuwHHiDV6XtnB0XIKsGlWAP7iCqXKgp15ewA8VgUBn24R5+Kk85v+EISpCLDLIsS0Rpt9sez+OC5NDq9boIarVabrfbrfE6bmhysoMhtm07nud9TTbb4iZbfn41xHGcD/Xzsz3u88sfsn9jo9HodTqd0A/JoLgfUi4R0zSbrutGLhEGxS2RwRftMLeRwTe2oW21g2/+/6c+AdO5vCABA1zBAAAAAElFTkSuQmCC"/><element name="elapsedBackground" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAcCAYAAACgXdXMAAAADElEQVQIHWNgGDwAAACMAAEQ1BAgAAAAAElFTkSuQmCC"/><element name="timeSliderCapLeft" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAcCAYAAABCgc61AAAAD0lEQVQoFWNgGAWjYGgCAAK8AAEb3eOQAAAAAElFTkSuQmCC"/><element name="timeSliderCapRight" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAcCAYAAABCgc61AAAAD0lEQVQoFWNgGAWjYGgCAAK8AAEb3eOQAAAAAElFTkSuQmCC"/><element name="timeSliderRail" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAcCAYAAABGdB6IAAAALElEQVQY02NkQAOMg1aAmZn5P4oALy8vqoCYmBiqgIKCAqqAmpoaxQJDJsQA+54Krz/ExkoAAAAASUVORK5CYII="/><element name="timeSliderRailCapLeft" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAcCAYAAABGdB6IAAAAWklEQVR42tWLsQlAIQwFBcVKGyEGK61cJ/tXGeVptPjwN/DgQnIQ9xYxRgkhqPceLqUkW5g5Z7g91BYiQq31BDAzxhjmDb13zDnN+/IP0lr7glFKkX3oCc+wAHpnIpi5hlqoAAAAAElFTkSuQmCC"/><element name="timeSliderRailCapRight" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAcCAYAAABGdB6IAAAAVklEQVR42tXJMQ4AIQhEURKMFZZCrLDyOty/4ijsYuJWewEn+c0buGeIGKUUr7XahtZaENHJgJmj9x7vkTnMOSMTkY2w1opMVX/BPxhjJNgBFxGDq/YAy/oipxG/oRoAAAAASUVORK5CYII="/><element name="timeSliderBuffer" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAcCAYAAABGdB6IAAAAE0lEQVQYV2NgGErgPxoeKIGhAQB1/x/hLROY4wAAAABJRU5ErkJggg=="/><element name="timeSliderBufferCapLeft" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAcCAYAAABGdB6IAAAAJ0lEQVQYlWNgGGrAH4jvA/F/GOc/EobLwAX+ExTA0IJhKIa1QwMAAIX5GqOIS3lSAAAAAElFTkSuQmCC"/><element name="timeSliderBufferCapRight" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAcCAYAAABGdB6IAAAAJ0lEQVQY02NgGErgPxDfB2J/ZAEY9kcXuI8u8J+gwH2chqJYOzQAALXhGqOFxXzUAAAAAElFTkSuQmCC"/><element name="timeSliderProgress" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAcCAYAAABGdB6IAAAALUlEQVQYV2NgGCqA8T8QIAuwoPEZWD58+IAq8Pr1a1IF3r59iyrw9+9fhqEJABv9F+gP7YohAAAAAElFTkSuQmCC"/><element name="timeSliderProgressCapLeft" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAcCAYAAABGdB6IAAAASklEQVR42tXDQQ0AIAwDwDqcPhLQgAlM8JqDORilnyVY4JLDX0iaOgWZaeccVkSEKyv23nxjrcU35pyurBhjWO+dFZDWmqkr8Y0Lr65i67XRzKcAAAAASUVORK5CYII="/><element name="timeSliderProgressCapRight" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAcCAYAAABGdB6IAAAAS0lEQVQY09XDQQ0AIRAEwXa4+iYBDZjABC8c4ADmHheStUAlBc/wb9oOAM45vvfewVrL6WSM4Zzeu3Naa04npRTftdZAkiVNScFTPhkFYuvY2zeUAAAAAElFTkSuQmCC"/><element name="timeSliderThumb" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAcCAYAAABYvS47AAAAwElEQVR42tWTPQrCQBCF84OsYJCIYEQrsZAU6QKx9xheyG4L6zTZs3iInGZ9Tx4iAWHaDHwwvPlgyWY2mVvFGNNf/gmZyEUm0q+kwQI4sBROWf6R2ShcgRJsRanM0UnUrEEFTuBC1FeaOYoF2IMaXMGNqK81KyhuwDmEcB/H8RVV7JlxRofiDjTe+0eclLKGDsUDaPu+91NRWUuH4hF0wzA8p6Kyjo5ZNB9t/hjz9Zgv3PwLzUthXjPT4hqewrzqDfMnQ2tu8Pr1AAAAAElFTkSuQmCC"/><element name="durationBackground" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAcCAYAAACgXdXMAAAADElEQVQIHWNgGDwAAACMAAEQ1BAgAAAAAElFTkSuQmCC"/><element name="hdOffButton" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAcCAMAAACu5JSlAAAAYFBMVEUAAABZWVlzc3MmJiYpKSkqKiosLCwvLy8yMjI1NTU5OTk8PDw+Pj4/Pz9CQkJERERFRUVHR0dMTExOTk5PT09RUVFVVVVWVlZZWVlaWlpcXFxfX19kZGRpaWlubm5zc3OfG0yNAAAAA3RSTlMAf3+Sa81KAAAAhklEQVQoU+3JQRaCIBRAUeyBkKlZiX1J/fvfZUOPyBK802vMxRhz04Lb/qVWPf6LVtUxRwD3PX1D1BW2Ht843Okh/iJePbOukP8CAO0Gqy7Zp5QGbAiW54c6pYE6pbS/iDQ8RODdcZfJ0onI4T2DjCCBOlj8lD+M0uPFAoRJ8i/Yvyp1ZS5/fAoUStSjBUoAAAAASUVORK5CYII="/><element name="hdOffButtonOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAcCAYAAACZOmSXAAACFUlEQVR42u2WsWoCQRCGE42I5AikkSBaGSwsAiIpQi4BK0vF+qwEjb1gaWMlaGfvA5xYWvgCNraChY0+gU+wmR3+DcPGC0lQrnHg43bvbv5/d25v764uYYdS6voc/MY0AqLEzYmICt3roJlGiRgRJxLELXD+g8hPQDPGHnIAwjiOpHsiSaSINMj8CeRBIwlNBx7RY8Z3xAORJZ6IZ+KFeCXcP/KK3GdoZbU2POLGPIJyOLiYJ96ICuERDaJJtIiPX9JCTgMaFWjm4eHIBRZHWR6Jd8JXpw8f2o/aS5Y8QSRRnqo6X1ThkTTmN1iRKTwfz87o9/sql8updrutTBSLRT63WCzUZDLhtoCvT6dTW8qDR8o2T2OBNL5leJ4WZBMd+/3+y+RwOKhut8vtUqnE92JgfLSiAY+0NHeIDFZo085gI5gvl0s+GjMKPpoq2IOzogmPzDFzl1eriPV6zSI2eAw8c/TZ1M6RAW33R/PtdqsMo9GIRQqFgqrVagy1+dxwOFSz2YzbrutaOeIckOaBZd9sNgro2bFQp9Mx575m5fu+6vV63K7X63xttVqZwfE1qSXLHrjgZEK5XGah8XjM/fl8bsx1nyuBWcqq6DweiNSSCy7wVZMJMNKm3B8MBkac+zCT8CBgLLFetYBNBjefHLnJBG6vu93OP7Wx1pTba6gfllA/qaH+TIT6GxXaD2Q4v86XoPgE1h55oNE1QD4AAAAASUVORK5CYII="/><element name="hdOnButton" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAcCAMAAACu5JSlAAAAZlBMVEUAAACysrLZ2dkmJiYuLi4xMTE3Nzc8PDxAQEBJSUlRUVFSUlJaWlpdXV1jY2NpaWlsbGx0dHR3d3d4eHh9fX2KioqPj4+SkpKVlZWXl5ehoaGpqamsrKyysrK3t7fCwsLNzc3Z2dkN+/dcAAAAA3RSTlMAf3+Sa81KAAAAh0lEQVQoU+3J0RpCQBCA0dW/i02KpEIzzPu/ZJc+7CM4t8e5k3PuYgmX9VNttv2W2iww9gDhe/iK3mZYHhRVIBwe+l9PYQWjzbB/BYB6gdl096ra4WP0PD/kqh25qq4vIjfuIvBuuMrkaURk8yUvGUAiefSU0/5hkJZSPECcZP8J62epztzpDzcuFrDsGN7pAAAAAElFTkSuQmCC"/><element name="hdOnButtonOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAcCAYAAACZOmSXAAACFUlEQVR42u2WsWoCQRCGE42I5AikkSBaGSwsAiIpQi4BK0vF+qwEjb1gaWMlaGfvA5xYWvgCNraChY0+gU+wmR3+DcPGC0lQrnHg43bvbv5/d25v764uYYdS6voc/MY0AqLEzYmICt3roJlGiRgRJxLELXD+g8hPQDPGHnIAwjiOpHsiSaSINMj8CeRBIwlNBx7RY8Z3xAORJZ6IZ+KFeCXcP/KK3GdoZbU2POLGPIJyOLiYJ96ICuERDaJJtIiPX9JCTgMaFWjm4eHIBRZHWR6Jd8JXpw8f2o/aS5Y8QSRRnqo6X1ThkTTmN1iRKTwfz87o9/sql8updrutTBSLRT63WCzUZDLhtoCvT6dTW8qDR8o2T2OBNL5leJ4WZBMd+/3+y+RwOKhut8vtUqnE92JgfLSiAY+0NHeIDFZo085gI5gvl0s+GjMKPpoq2IOzogmPzDFzl1eriPV6zSI2eAw8c/TZ1M6RAW33R/PtdqsMo9GIRQqFgqrVagy1+dxwOFSz2YzbrutaOeIckOaBZd9sNgro2bFQp9Mx575m5fu+6vV63K7X63xttVqZwfE1qSXLHrjgZEK5XGah8XjM/fl8bsx1nyuBWcqq6DweiNSSCy7wVZMJMNKm3B8MBkac+zCT8CBgLLFetYBNBjefHLnJBG6vu93OP7Wx1pTba6gfllA/qaH+TIT6GxXaD2Q4v86XoPgE1h55oNE1QD4AAAAASUVORK5CYII="/><element name="ccOffButton" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAcCAYAAACdz7SqAAAA7klEQVR42u2RvQqEQAyEfRpBG8GfQhALQWxEK0VFsLax8QH20XM3C0kjB96ujbADgxmi+bKu5+Tk9C6d56m+poes7kLpSRtBm6Yh3/fZyNIbx5HCMJRenud0HIcFVIAyUOq2bWnbNslpmgLO71lBeRBOxCeTwWVZosZT9/Z95yXMofhN1yFiOfmyLPZ3uq4rwdM0MRT54iRJdK/rOuRfvged55nYQRDIHSJXVaVzHMeUZRlqPHWv73teEpn9P7QoCgxhkNR1XWMRyVEUYUG+bzvoMAx8d2wswn3AGcaL4RszqKWNoOpBqPKcnJxeqw8HMtsZ4xog6gAAAABJRU5ErkJggg=="/><element name="ccOffButtonOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAcCAYAAACdz7SqAAAB8UlEQVR42uWWsWoCQRCGEzUcEhFsQpCzUiwsBBGLoElrp0HbsxI09j6ClaXgW5xYWvgCNhaWFjb6BD7BZmb5HWSXXAw5rnHg43bd3f/fG+f27uE+Qyn1GCa3mMVAnEj8k7jowdwyxKQnwiGSxDNI/Qmsg4YDzbh15/jRwaIM8UJkCRfkbsQFWWhkoOmwh2nqEGnilcgTZaJGvBF1onEjdaypQSMPzbRlzLvBYIl4J9qER/SJATEkvn5hiLl9rG1DqwTtFFId06ZIQ4H4IHwVXvjQLMDDkcJC/svEpwo5oFmGR1JSjD++ptNixGQyUcViUeD+JRaLhapWqzLmeZ46n8+mhAftLKo6cTF1UQB921AEpT2bzdRms5F+q9Vic5lnRB/armmaI+ooBAkI6TvCnYnwaDTitr5ynE4n2YQRA9aGR8o0baAKOXSaRMQOufP1eq2CApqNQNPD4aCY3W4nptS36Ha7emy5XHL/R4JNkd79fq8uVCoVLez7vu5Pp1Pd73Q6qtfrcZuvemy1WskmrzQC0yuFdL1gPB5rERhJez6f80ak32w29QbxHxumdiFZj8z1gu12KwUD9EYwzuYwk43xGsPUfmSswwGTwyLwcJBj8Hg8+mEZklbgMRj9gR/9qy36l3j0nyuRfphF+wl69/ENcVv6gzz3ulwAAAAASUVORK5CYII="/><element name="ccOnButton" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAcCAMAAACqEUSYAAAAXVBMVEUAAACysrLZ2dkmJiYuLi4xMTFAQEBHR0dJSUlKSkpRUVFSUlJaWlpdXV1jY2N0dHR9fX1/f3+Pj4+SkpKVlZWXl5ehoaGpqamsrKytra2ysrK3t7fCwsLNzc3Z2dky1qB2AAAAA3RSTlMAf3+Sa81KAAAAe0lEQVR42uXNQRKCMBAAQWCCIgGCGEU3sv9/JpXykCLxB8y1D1OdsEaLmqT6p6M6wKn6FuyWaUQL9zdcW2yuLV49dmTUL2S6gcYsr+IbwgdC7MYj/EoqIoZFHF1PL08QkYNO0MG8wMUw5LoOwCQyG+jWTMuS1iXW1SnbAaDLE32SOX+lAAAAAElFTkSuQmCC"/><element name="ccOnButtonOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAcCAYAAACdz7SqAAAB8UlEQVR42uWWsWoCQRCGEzUcEhFsQpCzUiwsBBGLoElrp0HbsxI09j6ClaXgW5xYWvgCNhaWFjb6BD7BZmb5HWSXXAw5rnHg43bd3f/fG+f27uE+Qyn1GCa3mMVAnEj8k7jowdwyxKQnwiGSxDNI/Qmsg4YDzbh15/jRwaIM8UJkCRfkbsQFWWhkoOmwh2nqEGnilcgTZaJGvBF1onEjdaypQSMPzbRlzLvBYIl4J9qER/SJATEkvn5hiLl9rG1DqwTtFFId06ZIQ4H4IHwVXvjQLMDDkcJC/svEpwo5oFmGR1JSjD++ptNixGQyUcViUeD+JRaLhapWqzLmeZ46n8+mhAftLKo6cTF1UQB921AEpT2bzdRms5F+q9Vic5lnRB/armmaI+ooBAkI6TvCnYnwaDTitr5ynE4n2YQRA9aGR8o0baAKOXSaRMQOufP1eq2CApqNQNPD4aCY3W4nptS36Ha7emy5XHL/R4JNkd79fq8uVCoVLez7vu5Pp1Pd73Q6qtfrcZuvemy1WskmrzQC0yuFdL1gPB5rERhJez6f80ak32w29QbxHxumdiFZj8z1gu12KwUD9EYwzuYwk43xGsPUfmSswwGTwyLwcJBj8Hg8+mEZklbgMRj9gR/9qy36l3j0nyuRfphF+wl69/ENcVv6gzz3ulwAAAAASUVORK5CYII="/><element name="muteButton" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAcCAYAAACQ0cTtAAAA30lEQVR42u2UzQmEMBCFtwNLsARLSAkpwVJSwpZgCQEv6skS5iieLCElzL6FJwxCDlllT3nwkb8hXxLQV01Nzc/Z9739l8gBBRE0j94AiBk3oAceJCCPCM2GauY6zh3AsR/vit5AT8zzBbZCoWdNWypQS0YmQM2tekpDkWzbNs1xqRMQwGraMtk8z5rD1k3TJJgLYF2WZfi2oEw2jqPm4HoHhHMOJNCDAxTLnGHIyALXhRLPmnsfOU+dTpkRJooc+/F1N/bpzLjhITxFAp77i1w3440UxALRzQPU1NTk8gF0y3zyjAvd3AAAAABJRU5ErkJggg=="/><element name="muteButtonOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAcCAYAAACQ0cTtAAAC2UlEQVR42u3WPUwTYRzHcWmBFnqKBYpAHVSQoEB8QTQaiMSILhgDiiFxUBMSlUETnYiDg9GJmDA44OCgo8bF18EFibq5MEBpeUsDIaVAm6P02qTUb5N/k5P2oNg46ZN88tz1yT2//p9e77lt/1u6Fo/Hc9L5GwEmmJGrY4bpz0JlcoOAPFhRCAU2FMAi46YtBa4LyEM+LBKwHSUoh1OUYaeM5yUDtxpSAAVFKJZJd6MGh9GEY6jHXjigpAQaBskySQWlcMpE+3FQJj+DDtxBN9pxCjUogw25yEkJEWbkw4ZiqaBWJm9GK86jEz0YRKKNok9Cm1El11th/i1QF2TBDuxCtYS0oQv3MIObuI+nGMIwIljAQ1xGI5xQINWlBhXBiTqclgtv4xXCUsUTDOADotAwIsce9OIsqmFHPkzJsORvpKACDVLNNfThJ/TtBb7ADRfCEjQm4/3okHkcyaXU3xAW2FEtFW3U3uAbVDn3IQYvQhjGVTSiHIX6MDMK4EA9LsRisbgR2jt8wg/OtbW1NZU+Qu+nX6T/zth1nEBl8q5cH1aGQ+icmpqKG9GHeb1ebWlpSZ2bm4v4fL7A7OzsIn1GYQ7Uod3lcsWN0N6GQqGhyclJNXG+srLic7vdseXlZa/H4wkRnLKMRr9ZFVr8fv8jLh4MBAKv+fbudWEvCfs8Pz/vUVXVRbXaxMRENBgMjiXGV1dX094g6e7GcqmuFVfQiwcszfvx8fGwhPXjGYEf+SxKNRqhI4nj6elpw1vf6A9dgRo0yUWXcINv/piJvRzfRV80Gh1gBb6yAsMERahugc82/FOnC1RQonvYHkELzoXD4S76i+jGLYKeJ6qlolGCtvC4gv5Jr9tGKrEPB9CAoziJNnRqmtaz2YM40+3FCgV2OHT71x7UStXH0ZTJFpNpqEWqtUnFRShFxWabZ1bvHLpd2yrhijB4LcjyXSSLF56sw4WE/HPtFwoiecfnKRGcAAAAAElFTkSuQmCC"/><element name="unmuteButton" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAcCAYAAACQ0cTtAAAAk0lEQVR42u2NwQnDMAxFtUFH6AgdISN0hI6UEf4Oxgdvkas9RUZQ/yEBYdChgoZC9eCBLBs/SZLkjxlj3Ol2RehJd6rfDq1UT81eKcwZVCMB9Zw/p7CzfErvXT2ndzB3kAitNfUUQ60V555zLFZKUU/zBscOdo7EFiOcmFLMcQli4y+6Bz4LBx90E3JV8CZJkvwsb8qa9F25tXYIAAAAAElFTkSuQmCC"/><element name="unmuteButtonOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAcCAYAAACQ0cTtAAACOUlEQVR42u3WS2sTURjG8ZqJuTSJTW1T26YqrWmN1jt2ISpWTb1ABS3iRkS84WUndlNQFN34Fdy5d+U36MJVQVroKgnmvgqBZBV3Gf8DTyQMzMggRZC+8CNnJsn75CRnzqRvu/6/Mk1zRw8fwBhbEeSDAT92ih+cU7D8dYiahxFFTPoR1HOG+Fxm7h6kRiE1H8Y49iKJEcQRRRghhQegmTuFKkQMBBDBbkwgjVOY0+Mh7McoEhjSa+OIIawehluYgSB2YQ9SOI0MbuEFfuCizs8ijYOYwRSSCo8g0J2hU9AAkmp0AbfxDJ/RhlV3sYgFZPR4GedwApMKDMNvD+v+RlGM4aga3McKvqO3XuKhxt/wFI+xClOBScTU12dfEEEMIqUZudU7vMKajjewrvGqZjiFOAL2MANhJHAENzqdjumE+ojXeMvxJkyxAh/hEqYxiKBT2AiOY6lQKJhOesNqtdpm93y1WvUUlsAsFrPZrOmEeo/lcrm8Zh1XKpUNxuvWuFgsun6N9t/sAM43Go0PzWbzU6vV+sInztvClvHEGpdKpd8LxArinPMCsa9GjGp287iD51ip1+tfc7ncTzV7gJu4igVc8bL07Rf0GGYwhwyWcI9Zvsnn80XG13EGx3AYafzxonYKjOoNE2pyEmcx3263r2nLmu7ZJ4e9b1ew7fQxhY5jUgEp7FPIAPq9bcTut5cQoohjSOKIIKjGhrjeYryEBhWMnnuZ9+buoaJgUcjW/xeRvu36F/ULlStUoyVtQSYAAAAASUVORK5CYII="/><element name="fullscreenButton" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAcCAYAAAB75n/uAAAAbElEQVR42u2R0QnAIAxEu1lWc5/+ZYKs4TTWjwS0qIFrP+/BkYMLOdCLELKn1tpG5TleYF2yyMUzvCAOZDtwgU85PJGE/+NPyuTJG1Uts/9+sI0+y6GCrtunLHKJHbjAZYcd8x28IJTmhJAtD4gEt9ueDIktAAAAAElFTkSuQmCC"/><element name="fullscreenButtonOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAcCAYAAAB75n/uAAACFUlEQVR42t2W324SURCHhS67VCoFbYhRkbQsaCwVSwgUaZP2yia9Mb6MN41vYfpIfYIm5QIegJfA3yTfSU52c1i98KabfGGYmd+cPX+Gw7On+2w2m5JPUfxfC5dhB8pQKooXvjGCiohFFRJ8EVTwVSHGtxOckSuOsCb2xUsDe0/swl42jiZxg2wr/kK0REf0DOzX4hXIzsVbaPODsH4VUSOxL8biwsD+SCEhOx/vo61Rq5zd1JipdhBkn6k4hmk2iKZDjdhtuj9Awnqm4twTPopf4lKM4BLfo0tCk1IjCQ3QFF0xR+QK/BBXYgxX+PycOdpmaAC3RG1xiui7uMWeic8ww3dLzgZNO7tEoU1OxYhpX7Dmd+KDgT0ldk5umt/k/DGtioZ4y/E7EUMx4JQcQR/fkJwemgY1OKbhAd6wnscU+ESRQ+jhOyGniyY4QFlE4rk4sCKIJyzFaLVa/XaNhT0iNiH30LTUiEJ9UGeqg8ViYRv3TVxjj80PY3zXloM9QFvf1gcN3mRiIr3pvX2u1+ufHMMvMDefn2MatI2iPjgSZyYylsvlg77fiK/umGLfWMzlmQbt3/UBQoc7530IxLf3QeT3AYIZbzbE9w5SfGfknGb6IAr1Qez9XL8XXabdxtc0sNvEuuS20MZFd0LsXThNqOOrQg0fcS6cXPHiKzOB2L8yg3GKG4WXfoBSUfz//W15ss8fvEcYMYnLr+AAAAAASUVORK5CYII="/><element name="normalscreenButton" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAcCAYAAAB75n/uAAAAbElEQVR42u2Q0QnAMAhEu5kD588JXMNpbIUEpCBpe5+9B4JczF3MQQjpcfeBz+4vxpMe2ULSIF9YjaqWM+hXWRrdA2YZah61Wv2/qGrU6nQkQK6yLmCeCbzFCmk02FxWX/WyYXw1H69mCSEtJ16St50Fqd0HAAAAAElFTkSuQmCC"/><element name="normalscreenButtonOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAcCAYAAAB75n/uAAACDUlEQVR42u2Vy0ojURCGZ9Kmk4A63cYLMhdE28tCECUgxCuzGBDc6AgO7uYizKAP4NKNb6S+g08gSZO8QZ7h+Bd8ScDDIZmsLfhIpc7/V53uPnS/e4uRwjn3vsto2sHiggdrw2iGaT4miiKGEhShBDEU8YSH9Jr3G4yLSZGID+Q9qCXk0rIBhoSaj4kyxlnxUXyBz+ITKKcuDdoEb+9KQrufEHPiXqyLLVETmwDUpEE7h7cYGhBxmQk72xAWR+KY/Bs4akfkG3gSekTebaJYFlWxKLbFDQ2e+P0BvRqabTxVekT+M+gPmBKZ2BWn4tn146czCNa+o83wlkNXUGAxRVx3fvyC11HHk9KjQFtvQIxoSeyIE/Fb/BWX5EK5auQnaJfwxsMMyMSeOKPZVX8IzVUjP0Ob+QP8Y1rhPq6Kg2az6Yw8z12j0XCKf4blVuuum9Y8eCvBY8ritFgTXzudzl273c4VzlBcG93/tmYa05oHb2XQMZ0RK2JfnFujVquVs9M/huVWY+g52hXzDjqmJe7jgqhZI+3wVvkFA04N8gtbI6/hSekRhV4VMS+vee3uAeOeOOSs1w3yQ9Zq0j6aB2/sPwP/ZTeFYUEsc/mZWISM2jKaeTzeyy50FWV2k/LgquQJpNSmySfxeLsPfnAQlzCC1dgAoInxDP9Vg8gAauG1//82I/ZM1DztW4wSL9xQTRdfTNL0AAAAAElFTkSuQmCC"/><element name="volumeSliderCapTop" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAGCAYAAADQQP5pAAAAFklEQVQokWP8//8/Az0B46iFoxaSCgCc1RH1YeQNRgAAAABJRU5ErkJggg=="/><element name="volumeSliderCapBottom" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAGCAYAAADQQP5pAAAAFklEQVQokWP8//8/Az0B46iFoxaSCgCc1RH1YeQNRgAAAABJRU5ErkJggg=="/><element name="volumeSliderRail" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAABaBAMAAABZIivWAAAAElBMVEUAAAAFBQUMDAwREREYGBgdHR03I6ZBAAAAAXRSTlMAQObYZgAAAB1JREFUOE9jYACB0FBnRQYEGOWOcke5o9xRLpFcAHrGXu2heWCwAAAAAElFTkSuQmCC"/><element name="volumeSliderRailCapBottom" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAECAYAAACdiF9iAAAAXklEQVR42q3PIQ7AIAyF4SUNFS2IgsFwJu6vOMojxWxiAhLEnzQV/dIHwFatNXyrtcLMEGNECAG7d07A8QeqKph5XAdTSr2U4tAq5+zfLZCI+mXwRUVkOOT57LuTGxOHyxYWoA3uTgAAAABJRU5ErkJggg=="/><element name="volumeSliderRailCapTop" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAECAYAAACdiF9iAAAAYUlEQVR42rWPOwrAMAxDC8EenBjyWbzkTLn/lKOojenYIYV2eGCE0UMHgG1UdYjITClhse6VvenYfsw5j9YazMyptbo0xogQwvhc2HufF7hxaSnFhcw8/xDiQegriQi7PSdToRYfbwRcbAAAAABJRU5ErkJggg=="/><element name="volumeSliderProgress" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAABaBAMAAABZIivWAAAAG1BMVEUAAACHh4eKioqfn5+3t7fQ0NDq6ur+/v7///+YzFHNAAAAAXRSTlMAQObYZgAAAB1JREFUOE9jYAABIZOwCgYEGOWOcke5o9xRLpFcALCLYQn1nJm/AAAAAElFTkSuQmCC"/><element name="volumeSliderProgressCapBottom" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAECAYAAACdiF9iAAAAV0lEQVQY063NsQkAIRBE0e1wy1K0iC3DNuxgQ8EaxG9yl4qCA5P+J4CcPIRASgkzo5RCrZXeO3NOvh115AL0DejPwRijbkB9DgKSc1Yz8x9srfkYQ28aC1C0VIlhW9TxAAAAAElFTkSuQmCC"/><element name="volumeSliderProgressCapTop" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAECAYAAACdiF9iAAAAVklEQVQY02P5//8/A7Ggp6fHX0REZIKEhISCpKQkg7i4+ANRUdECZmbmjcSawUKsws7OTn8mJqYNyGJAixSgYgFAvJGqFgJDYgIe6QlUtxAIFMiUQwEA7UISnKxjTHUAAAAASUVORK5CYII="/><element name="volumeSliderThumb" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAMCAYAAABx290PAAAAoElEQVQ4y2P4//8/AxGYCYjZgZgPiIWBWASKhaFi7FA1BM0i1jJuIFZYtmxZZHV19czKysrlIAxig8RAclA1TJRayAh1veLBgwfzz507d/0nEPyHAhAbJAaSA6mBqmWk1EJQkNlcu3bt/H8cACpnA1VLkYVM0HjyRvYZOoDKeUPVMlFqIShxBPwnDAKgaoeehXQNUronGrpnC7pnfKoXbQD/kRzhlJYiYQAAAABJRU5ErkJggg=="/></elements></component><component name="display"><settings><setting name="bufferinterval" value="100"/><setting name="bufferrotation" value="45"/><setting name="fontcase" value="normal"/><setting name="fontcolor" value="0xEEEEEE"/><setting name="overcolor" value="0xFFFFFF"/><setting name="fontsize" value="15"/><setting name="fontweight" value="normal"/></settings><elements><element name="background" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAABGCAYAAACQRffVAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAJZJREFUeNrt0skNAkEUQ8HfLCckgiCFzj+pkeaEkCcIji5n8FReSdYU7TEz97bgZ1vwqy343RS89t5HlXCSpt65TdkIC3ZpwoQJEyYs2KUJEyYs2KUJEyZMWLBLEyZMmDBhwS5NmDBhwoJdmjBhwoQJC3ZpwoQJExbs0oQJExbs0oT/3Eryqbr0zBxtwWdb8Lct+NcUfAE1iVcp7XTJMwAAAABJRU5ErkJggg=="/><element name="backgroundOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAABGCAYAAACQRffVAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAJRJREFUeNrt1bEJgDAURVGL9IIgtk6XJazdLouIIDhBzArW7wQywOHCf6X3vk9Br4w/p4GXNPCaBt6iwLXWM61w1CtjloCBgYGBzZLCwMDAwMBmSWFgYGBXWmFgYGBgYLOkMDCwo6UwMDAwMLBZUhgYGBgY2CwBAwMDu9IKAwMDAwP/ALfWjrQdvtLAdxr4SQO/SeAPma2iNoRdiMwAAAAASUVORK5CYII="/><element name="capLeft" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAABGCAYAAAATgc7uAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAPdJREFUWMPtmNENgyAQhoWeNh3BNXxyBQfRAZp0iibdxOdu4YtDdAe0pZyFhBAVkMceyR815uP/vePlZNnKklKyLGCxDYhZ75gX1qAR12Je2AFBg3g97W0CzkagVSidred12HI1URG6dF3XjON4m6ap3IoNlquJWrRt2wzD8PBVmzux8RsBHUNaBU5rFnchRBkC85XqBx2QZBg2juch56j1j85UMCoYtYoKRq0iZ2oVtYpaRa1KcJY/42POUisKNtBHac7z/BXrjPAb4aqq7hjdJ9t5cVUSfd8/67q++hLYUyyPHkSd2LO+Nyl2R+D04Tt57D/yw+ELm4ekhIq5RrkAAAAASUVORK5CYII="/><element name="capLeftOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAABGCAYAAAATgc7uAAAACXBIWXMAAAsTAAALEwEAmpwYAAABa0lEQVRYw+2XXU6EMBCAC9vFBfXJ+3gArsAdfORGhhPwyoMJ4TQ+IqJra7vOkNmGhY5GTEwnmUxo+Oavw2Yn0lpLIURMdGdUgkW155GjQhLA2j2coZWOo3gORjAhegUWnbkOJnhPgIPRFOyBOJPk/QnGGhN4OTN6DTaDM8ziLLokaSUQ0YI3VVXdd11XDMNwJy4IjYwpZxZsmuZBrMhs2m3bFuYKBQeeHCylSoUOBu24l0ho+46m75Myhc/GkgtHtARfeG7gY07NrkSctM/An8An+eew97V4R1ZKhW5v1u0w27/U7XBVYbb/AN7k1zNcVfiqtoX1F/v9mjWnZu2o4kSeINAPbmSEjtZyGqYBRPiNA2PUdwsaHTk1Y8QjwK9pmj5bB2tK4RNo9CXP80cfWBJ4xNW3LMsnm1Zd10Xf9xd3LPuv/tbZXlmLKE07IlOGZ4srsIJO0/HE7o9ry7eCB3RAr25x7ffeZObkE3/9GJJS0Pv4AAAAAElFTkSuQmCC"/><element name="capRight" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAABGCAYAAAATgc7uAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAR9JREFUWMPtWEEOgjAQpEi9mHj36p0LvMKH8ARfQeID+ANnXsGJR3g3McZaqF2yJRUDFIgnd5NJKDA70y6XgSmlmOdQjDHVvxdobEY4hqA11FcTIPMJMqBBtE1MAyDvJki1hsRriTbaBkDej5Al4qkh8Jk022FxHN+GPHPOr2EYplmWFXr5QEh0o3ywMAQhxKEsy0uSJCf98ha36YOohxeTVVXV2ZpMN9rAjGCswEFP1V3ZfCe26mqyk+2h8r0V9Y/KdGB0YDQqOjAaFSnTgdGoaFQ0qh8pKysezlZeRoZwZkXCromT7SiKUjvJ2Sl2VFHHxTTP8wKzpK3uMa18nBFEzboxKfY2MwJ/2L7PCd8AO3y/XGJ/t89e7K+X/nB4A40J1nXAbLZWAAAAAElFTkSuQmCC"/><element name="capRightOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAABGCAYAAAATgc7uAAAACXBIWXMAAAsTAAALEwEAmpwYAAABi0lEQVRYw+2YQU6DQBSGB5iqbRcmauLWa3CF9gTEdbcuWXgAb8I1iGnCxrDxGCbWnVIoDL6RN+Q50ToDMTQpL/kZ0vLNP/MmNPnL67q+YU3VmgSoIipxFEocLucaLDRAaUdGRwISviAwBdXDBSgHeXjP8LtawlcaXBJIaguagDLlqJ6X8PUPrspNgh+4QkdfIV+tVg/sl5pOpxvf96MgCNYEbJvI2Z7KsuwyjuM7eQ8TPJKGSXkcjor9VUmS3AL8RLbDjWG5AhjOQCcINjAzr1OEJ3hsrpEzlnL1UI4N7BHY7QK7CvyCLfbcQi1s4ezoH9jCTleY9XE+JJj1KC6EOLqGDdftY2zYcN0ej2ps2P/Cw/16jkc1vlUHA6v002nPdR9noQc3G2ea5hrYwlmPhFZwQeDKFs5xgp1yN4Jns9kG011B4mJlBC8WiwhjIZ1gPzyfzzfL5TIKw3BN4LyF0zS9NwiiUu+YZNW+S3nOLwYReIvg92XD5dUwfBdEOxX73zrE/vY/g+eur+QngghRa911OowAAAAASUVORK5CYII="/><element name="bufferIcon" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAQAAAAm93DmAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAABctJREFUSMeFl8trJNcVh79b70dXqzXqlmdkxYkkP2SNhjAQ8oLEYUyMGYIN2XnhVfZZ5U/IIkv/AYasQiAmCdk4D4cxIWCyUBYDE9kje/SYaDKtR6u7VV1d73uz6JLUI3fLBwqaus1X5/E751QJLpkS5z81dCxcPFwsICNmSExGiRSKiWZcQp3hBAING59GPNe+ngdghtfbboceA1KUYjLSGMONIKKCahh4zB4ubq87d/SWYHh0cG/5wTyUSBTllR6qEcxAx0CrzkxqcXP7lvszZ81HEKMvb78fxG5MSoFkuodKINAxsXGwMREUSHSCgwX3jrM2T4Ag5nBNvt5+vHTMgAyUmBS0ce6diUtAfWt+GAhhDG92kPhyRm/5BBiAT0C8lAdY6Ii1xmMdRcJgUsgCA5tg2NpY1V/Vl6F88vHW+n9bUjPFeVJBoIcAf7d+sdImHwUdsY98FijQ0HGob6zaPzK+46GT3EpWH3z0/V07G5wkxPhAypD8uBb2ivcWhlmeVwSfRR5fAPUqfza1ra/F37Zeb9EkwBaqoYqsfeP06UAtZK2SmB7RZvj7F7c+yD/RO0Wi4rMMWiRkl0PWMYeBvuxRxwJqKhPxCx3vpYOlh1/8unwtbaqg2B7eW37gHv/T7RWRzMYL4lxk8kLYQgjQzzWjg6EKotnerZOnO3mAcsOX2m6H3q7oGPmUPjnLIUhyIyqfJOsJPlAQK7lvnRIydNTSISbqrPV6RtbI1DMeJl/uFEVx8+jjT5NXOkspuooJ+8P7620GDCgQCBSSnIL81vGmn2ljuGxcOkJpaJijrm1f31x1b9tfx5T78f3W5uouXSKKShYShUSiRJ3n0CtCyR7pONDAwMbBo4af+Dtz3UBKN1ppNzr0GZBQVkA1uoQCTK5hAyH9cRWCUDY2fj/Ymi8CywzUC6GTkZFUoyqp/FOjP3+pBhoBJpATjsBCBfhbzX+/MrNm14Quo+Tz2zvPnxARk5CPhsC02YfNItZ5JvdJwcDqBRsvN3/g3fCFIBXatX/lb/SDnJTiK3DaGA4sFtlBapibczNr3o0WLdVSTVV7znt5s15VVcJUHARjuBEyAAMjcc2ah48BeCphMDd00BEXuZti5qQ7lZ7GJwqJUqgrUVeYRuHE+SAhQVXNkA3chBKF+ApoPumORr7W6W9GTzuc0BMdEbb7D292qwGvXQkML2ZMVecQDLJG+K2tDfK1KBBOfnL62Xd36ikKnRI1fbsBkv1LspFnwvZ6wcNW5mtaUKx0/ZiEhIyMgvxK4UwUtoGOjY2DgxmaG/U9tyjd6HuHywMSMgqkkEpcEtAVrachMDGwcT9r/O0bMwtWXdPSfv/p0s5P2sTkFFVxLtpvZvpwMFBAgUYJf16YX6nNOugqda3Grno0WBntX3WOVIo189MLHOgs8mgMKJQSgEJ8VPfnvUZD+QgyhJPd+ORgZUBx5lvVO3LvmmU8M14tas+ugNGhduw5gY2LBlh4OPWOh4H5hfG7oGtCkL3d+2ZOaTrF5dJM3ClKqvHHCpClQvzD+82CO2MZcJT/qnt3792Bq5UCsivfvhQKORftdJP5mFHIMXH/+fBI/+PifNN1LAU5vv0htz9/MfqPdwk3tlO08+wUb3bz/4X7XU7ockKvd7D/w5N7vtvwnYA6M9SZcZuzf5j5ZShKS4zhovGdYoBQSiApSN/Z/i3DqDYriE7Dgx/vziVPXF23sZUO2OTU7NB6Td15/NcFy6y8jNifFLKkJGsNfv7wL4cdH5aGb/TIUakspBybRFICfJDyqFHPDGDIcEIOhVJQApLizRQNRgJBaEmSZyrDBgoy4ryZjVTR703rxaphUJQUZCQMGZKQkpO/1Ts4OY1DBkSE9OKj7k/7ldSn2LlshFIjv0azVgEC8Wp6d+9DmrOeqWlRetS9u7eeTXt3PZfbuClx6VRHv2/+qRFaF8KmvGr+CKZa9VWgoaFVXo8yq65aXf8HamfehM+M5GIAAAAASUVORK5CYII="/><element name="errorIcon" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAACL0lEQVR42u2T64nCUBCF7SAlpIQtISVYQkrYElKCJaSElHBL8LfPKD7wyUXxgYrOzkCyHC6b3LgasywOfBDuOTNzcklq73rXfygiqjMxk1YsZ38lXIOyq1F1OI/s5VUZsAlBNOMlaDhvVhXOZ7B80D4ztNeV+VNY9VdUzg3VM/5srM9XhXOMb0zleJXxjTqlB7xer8HtdiPAy/KKhl7pLTXc5XJxGc1QggJNIXgOfs24pQU8nU4hQynn89kFjZD0XDyGFpYS7nA4uMfjkYAQddQEQwtRk1lPD7jb7SKGUvb7vWvoTdCbqIkXNCF6arjNZuNtt1sCAtPDZwp09YMe4AyZ+bSAWmvFUILm4Y7Fo0xderQUep5Rq9XKW6/XBAQ/+fi8AZ5GhicwZj1+i4vFIl4ul5QQZ/lYC8AX5Pi+58nsh8LNZjOfoZT5fO7neAPwZgaUGeIB/F+Fm0wmznQ6jRlKyH1b1uvgred5zbmy6+6Ao9EoGI/HBHh5ftF/6SXZdVe44XDoMJqhBFWgxwO/V8CvwK+Z4rfY7/eDOI4JsC4cDAYO4yVYl8lM3CE7C4XrdrsuQym9Xi+qlVQyW3YArrWp3W6HDKV0Oh1usler1fLTHnku0iOzxQ+EtiUfDAHYYOsl5I6+0Oj9yDNHYNSM84KADqOhNyq65K5fX/wP9tpfznrV9kWu7dbtn1bxgCHj1sorfKmwaEDFUMUo21XrCsNpyVD4yl8GflLvetcfqy+dCCa6ODMoXAAAAABJRU5ErkJggg=="/><element name="playIcon" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAAkUlEQVR42u3RsQ3DMBQD0WyS0TKKRvFcKgSNIv/CQAoXV9jJueAB7B/AV0opJW6t1Wpb7f1c4BFAfSBAfSBDfSBDfSBDNaAMZaAMZaAMZaAMZaAAlYDfPpeBY4xWW7/YnPM6sPfeauvmbbXTxTLwDJOADJOADJOADJOADJOADJOADNOABNOBCPOBByyllNJf2wFoaMEN9KNmIwAAAABJRU5ErkJggg=="/><element name="playIconOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAB6ElEQVR42u3YPUtCURjA8UpNLTMSe8EyoyCiCBoqMlsiiKgcmoWChmpoq+Y+RdBX8As0txSUawgagvgKOqvj7T+cAxducblk5zT4wG9x8Q8XH+85fb1RNYZh9P/LKGHATH6uPQwuuDEIrzAIN1wyVlegSwQNYxQhYRQB+OAxh+qIC2ISc1gU5jGNMILwKw0VX+JBAFNYwhb2sI9dbGIZsxhXFmr6QXgxhgUkkMYL7nGFFA6xjRXEVISaH68fE1hFEk+Qk8UDbnCGY1WhMtCNYUSwgRSeDevk8Yg7NaHWwBnEcY5X/DSfCkItgQFEkcAF3iBGZah94A4u8Q4xqkPtA6+QgZiuhMr1NAIf3DJSQaBt6BHiWEYUIQzBIyPVBlpDb3GKA6xjHmFLpIZAOXk84Bon2BKRIfjg0h0o5wP3SGINEQTg0RtonUfEEUNQPmZHgY1GI1MoFIy/0Gw2fx9Yr9czuVzO6KZSqfTRarVsHrGGwHK5nG+32zY/Eg2BhH12Oh0Ha0ZNoAxzvKj/OlCGKfmruyTw3WGYspeFBC5qtdqbxjD7F1YCXzWG2b/yV6vV5+/WhaIw+0NTpVJ5Mi3YLHtM56HJeuwkKl0sFl/Y/PqOnfoP7vqvPvRfHvWu35xeYPaugHvThfkCD3B8xDZ31q0AAAAASUVORK5CYII="/><element name="replayIcon" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAABxUlEQVR42u2XwY3CMBBF0wElpARKcAkpISWkhJRACS5hS3AJnOHAwoEDB2QOHJCQmP2DcrBGycZ2BtiVMtKTEGLe/NixJYq55prrxUVEBjSgBStgu88NMJ8KVXZBPI2XBxaU7wi2AJbyy7LjVeGWwNP08uzSDlcDPzLUCcZ+X79j5RyofumtgNNeSfnO+QG5SfCYIc+kd3LgQKxzpNzT9cqy2VfJ4BPr70iptXpG42JXWcXH4+EBBbhCqdgl3D5JcL/fDSBBpRWQXT3++N253W4NoABfKBc7xYwmuvl6vbaAApx2QHaKGW108+VysYAC1AOyU8yID3g+n1eAAtQDslPMiA94Op1aQAHqAdkpZsQHPB6PDaAA9UPCTjEj/pAcDgcDSJB1zez3e9Pjr3r8Jkm82+08oADe5lSH6Xqt+N4Jd/oObbdbCyhks9mYREcd9D9DskN6gU0OCFEJSODBIsGxEv22c5Ag7/9KJyTBV0K/AzSCLXKLV6vnieuEftkr+RY7khVyGQyqJ74iEp0/TxBVTGKPedX2aj1UC+jPhuTDBEgvpH7AdUJA/4GAw2GAAy2oNQ7KlEt+DWwXxoBFMddc/6x+ACbEv+zn5grUAAAAAElFTkSuQmCC"/><element name="replayIconOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAGZklEQVR42rWYTWxUVRiGoTPM0LG20IEypUCKTX9IhCK0iqAVGtQAIUasAyaAWkaJJlZMhigs8CcaEhdSdSNx0bhRFrqQjS66BTFGFiSFgC2/bWkhQIFSZ4pwfW/ynOTkwO3l9yZPAnfO+b53vvOd95zpuLt9PM8bb1EgIhB1iECBPWfcw3psUQiYIOKiUCTEIw4JPoszNmqLfRjCIkYUyYtFqSgT5aJCzIAK3pUxppg5RmzkgQh1KjZRFJEwJSpFrZgnGsQisRgW8W4eYyqZU0qMiXZF70dcRMRYslKqUyMWiCaxUrSI9aJVZKCVdy2MaWJODTFKiRkz1bxXcXGWJyWqRaN4QaTF2yIrOkSn2C8Oii7+3clnWcammdtIrBSx4wEiQ8VNFCV847limVgn2kQ7QvIi7Mkztp2564g1l9gl5ELkHVaOiTPFfLGCpdspjoh7fY4QI0PM+eQosSsZtiFilH4GAVaJd0UH1bivhxgdxFxFjhnkjAVuHARGad4US7CCQL+JfEjSs6IfzoaOV0xiryBXitxRBAb2XZLd1iwyIZUbEHvFJ2KreB+28m6vGAipZIZcNeR2+hGBGGgR5W6kmXcGiBsVv4odYrNIYyfLYaVI89kOxo4GiNxJrkZyF6FlvNt7cfypFjtoC9gQQ2K3yBK4GY+rE1VQx7tmxmSZMxSwcdrIWYuGuOlFu/cSopzAa7EF9xkl0QdiDSdGNfOSogSSvKtmzBrm7A6oZDs5FzAvYXrRXt5ijqQmjLXLjcJSZUnYKGYjpohvHYM475KMaWROlhju00XOJjRIC8vsLG8d/ZO9efNmTngWA/TTOqoymzmFBONqJbhY8FkpYxcxd4cfy4mdQ/xKUWcv8ziCFXLzqBctN27c6Lh+/bpno3d7afpmli7JPPfQdy8ZhYytZu5mP9Zt4nf4udFQxryIEWj6r0Fs0ITOXC7nWeSxjbTpE2u3FYQYv3GH6cxN+7H8mHYOP6efGw30oQRa5lzBMrRqwv7h4WHPMDIychZvM0uQDDma3Crir7SQYvkx7Rx+Tj83GiqMaRuBxv8Wi4wmdA0NDXmGK1eu9GHAy7GRSeZYCrt5O71YLZ4XW/yYdo5r164dwLQXGz8MFKjJBy9cuOCBHyBYYHDV4ggrwnqmWR67RTH77RxXr14NFugu8eXLl/cPDg564Adwltgx09tsDERNFeUkrKIHXxIf+jHtHMoZtMS3bhJ9u86+vj7P0N/fbzbJq+IJxtoHu3ueT0JUragn7tNU7w3xhR/TzqGcQZvkVptRuTtOnTrl2egb+jbzlnhOPIYIU0X7qvYoFZgnll68eHE79vGa2CS2q4V+d+MrZ4DNBBj1iRMncsePH/cMZ86c8Zd5m3iZICmRsHzQvQ0tu3Tp0uea61fob/3/Yy4G3/X29p63YytXoFEHHnUS1HXs2DHPRsuwhz551jqSYoiLIjhFG7xy7ty5PWauRPXo3c+q1J9uXOU6zCHgHnXBlwX51K6jR496NgqWy+fzH+nzF+2bhznaWN5ZYololai/7Pmq5HnF+M+Nq1zfcAwudC8LY1233jt9+vRhN5iW4xBLMcdcMAkWoy+rsKM2je1jXiCq3j84xConJg4RfGFNj46OfuZXzQ44MDDwAwJqxGQRt08LkqwW2zQ3P5a47u7uER1x32vsO2Ipl4oSx2Mdi8Dx2a0btOPalehfBfT96kes5imW0vRg1HGCtJbt27Dq6fTYp7G7RCsGPZM24UYd8KMJ15+DyBY1+9c+3OmeoXpTERW1e5jqb/Q3VJjAXj0a+5UlcFaYQNvLUghp8EXBQqo7zbrNROzjEkPeJCM+gJAxUZ934a/uDi4Y8+8xJJyC6VZChblBW/ZSYAmcyQ7OnDx5shsRoWjsPusAcHowWOQE+7CHIucGTdWxGAlkqd7s6ekZRMCdMMwXqwwT6C63ERoDhHG8gVXBCvOTNUiMv7NlP/16/lBf/6Ij9FNsq15Mt3923tWfel1RDHONfpp4XDt/IzbSpx47JDH7tGl+km196Z/FXN0yYi2eu5DqTXZ+uN/341rUZBIt4GLawg3ldbEei1qNjy5BWB2tUWqf7Q9WIH2IRSWxizmcyU9Cg6jnfRVjyhlfbHrbFfcwRCZo9ClY1XQoF2UImsSmSlD52IOtXPiPpBiJEwF/9TcbLupuOjfu/32eYAv3OqcpAAAAAElFTkSuQmCC"/></elements></component><component name="dock"><settings><setting name="iconalpha" value="0.85"/><setting name="iconalphaactive" value="0.5"/><setting name="iconalphaover" value="1"/><setting name="margin" value="8"/></settings><elements><element name="button" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAABIklEQVRYw+2ZIY6DQBiFZ9g2LSSVFc0eBYmoALEXWNdLrALUSi5Q1wtUgKhAcpTNCuQ20KRZ6P/orKvqihnx/uSFAcyX92YQD61kxnHUcnkx8pTdGUS/kNZ61AZuLvJFK9HSIiTgLqIfUS+6zoxrgWiTZdlbXde7vu/XNuh832+jKNoLx1Fuv0VnOLiQxTpN0/eyLD+UA5MkyWee5wdZtgBEtK9hGJ5sOffIyaZptrL8mplnXtd1TsBhDMt0Djzl+Pw5iE8NAZ8ZRkxA7kFGzIgZMfcgHWTEjJgRM2ICcg8yYkb8f8ABlZcrDVcQBK26t61TxFPtGsfxHi66ILCoexU8wEEU1ueiKI54WVXVzpaTcA5wYAET2Jwv0bU5IM7+hrgBWF0NYtIbQnIAAAAASUVORK5CYII="/><element name="buttonOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA6pJREFUWMPNmcuO4jAQRRMIbxgEy/kalr0GgcQvtMR3IdFCswL1CvFFE/Xwfo9v2jcqPOlg0jBgqYTJozi5VS47xj2dTgXHcWBFbehnlKWVudru2U7aDsp2ylbKltpWngaqKqspqyv7ISBT2ol7Rzi0o4D7o+y3Mh8nPK0awH6+vb29TKfT7nK5rDkPaMVi0W80Gv12u/2uRdkBsAT1BoPBy3g8fnUe2BaLRW00Gr2qtHM6nc4vdWiOEOYR4slk0j0ej84zGFh02uU9nWt50DtP0jQLhMt4erRmQP5kLagknk7GFOKepLmuG9mnv6R+dQVxCegmcZRKpQIo2ln9UP4kZAL/LgE/C5FliAkDONNMQCb94XAIIa8F9cyQ2MCl0+kzIyBVJAjAAIhz6NOugbQGNOE8zwtNQkr1ALPf7yPBbSGvAiQEoLLZrJPJZAKTkPRFuN1udxZ+wtuG+2IOmjkHGEABMJfLhaCEpC/AwTabzRmgLMg2kFYKMr8YWkDl8/nAAAkDpASEctvtNlRWhh0GfzcBlApKQEAVCoXQcAznCAjl1uv1P3BQVZanS9UjNsR8SqoIQOYdVSyVSliFBJA4jnsAATgCE4xpQDib0mMVYlNFCQi4SqXilMvlQFVch9Cq+TSEY7jNwWRTxGMVlI7kQDEhoWK1Wg0+cd1qtQqVRKjNUmROiXFhjlUwKgRROQnlAFev14Njvu8HYBw4MqxyzraZr60BTTOB5Sg3VYrzx3KTuA5GLShZKliIoZZ6TQiUAxj6OIZzrIec9ni/WQu/goxVMAqMP4ikBwTyDbkI1fAdgPicz+dnoBI26qETlxmqhR9A+AiGMiKLM84DFPegD3BCoo97cC9Vt108XMxBWcdkuWCu8TyB+Z3qSkAJybB/uw5yXgUMnMtSwSTHcajH0UrFoyBxLRW8FF4rQK5M4NQsEVSWCwaC86EAA2WZEhIQdmkEW88kZp5QOYadqxm53OI5pgUHi1TwJsst8wHMEY0fkytrqS6Vl6NYwl0FeOliOjUB5ZJKFmezXnJQMPfu8k5iFlsOnq/eSWRR5mfil6ZrngrXcjEQ9eop0+HaJX4U4OnTp/3NUXNx3CIg4ct7wEXA4y22PqJ2Fr7RjgQMdjZv4PAWULKh8B483Vmr9Zw/m82eYodLrdCxu7oGW0p3PprNZj9u/fc/DSxgAhsUxMuD3+v13nFyOBx2H6UklGu1Wn2w6D3qBXa16k+8if7h6YNMyvmz/Q3xF8MkMy/5vFshAAAAAElFTkSuQmCC"/><element name="buttonActive" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAMZJREFUWMPtmEEOgyAQRRsPYXoOOETjnbyKV+otYOVWLdhIh6QrmcSFNvxpxuTFBQtenD+ANDfwpxElaK3tiCcxViLP3bGCxphHSmkg7kSsRJ57yC6FIA30FcX29JxgSwQQWi6DAYziCwYkOMGIhJb4FyXWDJ7NYARDM3itoIRlBrtJJAhqBv9+q1uR0BLrToJYYuwm0QzqaUZPM8f/JC8w5HXxAiS4cCWegBbpqRB0zr3pNQMsL/PXpbyj9t5vxFqZTdQt/wfHrfEyP8XwewAAAABJRU5ErkJggg=="/><element name="divider" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAoCAYAAAA/tpB3AAAADElEQVQIHWNgGB4AAADIAAE/ZR2JAAAAAElFTkSuQmCC"/></elements></component><component name="playlist"><settings><setting name="backgroundcolor" value="0x000000"/><setting name="fontcolor" value="0x999999"/><setting name="fontsize" value="11"/><setting name="fontweight" value="normal"/><setting name="activecolor" value="0xcccccc"/><setting name="overcolor" value="0xcccccc"/><setting name="titlecolor" value="0xcccccc"/><setting name="titlesize" value="13"/><setting name="titleweight" value="normal"/><setting name="titleactivecolor" value="0xffffff"/><setting name="titleovercolor" value="0xffffff"/></settings><elements><element name="divider" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAAACCAAAAAA4QMyQAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABxJREFUGFdjYBgmgNF4kHvk/////yAYiULjgmQAWl8oA3rmsQsAAAAASUVORK5CYII="/><element name="item" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABQAQMAAABmo6jzAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAABhJREFUGBljYBgFo2AUjIJRMApGwShABQAIIAAB7mDNVQAAAABJRU5ErkJggg=="/><element name="itemActive" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABQCAQAAAD2ZPI7AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAALlJREFUeNrt1TEKgDAQBdE1eKPc/2BuIKaxFiHNCm9AsLBymL9HvwM7zMi4nuftbXz4JiNPPmrR/AJCQMh/cEMUAkJMFhRCCEyWQkCIyYJCQIjJgkIIgclSCAgxWVAICCEEbohCQIjJgkIIgcmCQgiByVIICDFZUAghMFlQCCEwWQoBIYTADVEICIHJUggIMVlQCCEwWQoBITBZCgEhJgsKIQQmSyEgBCZLISCEELghCgEhJgsKASEFWRFhQfEpma1IAAAAAElFTkSuQmCC"/><element name="itemImage" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADYAAAA2CAAAAACpLjUBAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAHpJREFUSMdj4WUgB7AwcJKh6zsLUCNZtpHnSEZydDGSaxt9tY36bdRvg81vIzFI9u/oZCj3cCTVbzs8GBg8dpDst04GDwaghST77eU9hpek+y3e4hCD5f+FpPrN8jhQi+VCUv2WAcQLF46mydFsOuq3Ub8NJ7/9J0cbAHqLFBrXmWogAAAAAElFTkSuQmCC"/><element name="itemOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABQAQMAAABmo6jzAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAABhJREFUGBljYBgFo2AUjIJRMApGwShABQAIIAAB7mDNVQAAAABJRU5ErkJggg=="/><element name="sliderCapBottom" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAKCAYAAACqnE5VAAAAEklEQVQ4EWNgGAWjYBSMAnQAAAQaAAFh133DAAAAAElFTkSuQmCC"/><element name="sliderCapTop" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAKCAYAAACqnE5VAAAAEklEQVQ4EWNgGAWjYBSMAnQAAAQaAAFh133DAAAAAElFTkSuQmCC"/><element name="sliderRail" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAECAYAAACQli8lAAAAGElEQVQY02NgIAIYGxv/x4cZqAVGLcIGALPLMwGVH99FAAAAAElFTkSuQmCC"/><element name="sliderRailCapBottom" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAECAYAAACQli8lAAAALUlEQVQY02NgIAIYGxv/x4cZqAWAht3HY9F9alrkj8cifwZqAqhlyD67T4olAKQZLJEigaEOAAAAAElFTkSuQmCC"/><element name="sliderRailCapTop" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAECAYAAACQli8lAAAAMUlEQVQY02NgIBIYGxv7A/F9IP4PxSC2P7H6SbHkPw5MPcvQfIKO71PTov/4MDFmAABBryyRE3nBsQAAAABJRU5ErkJggg=="/><element name="sliderThumb" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAECAYAAACQli8lAAAANklEQVR42u3NMREAMAjF0PrXgQ5UIIGdkeUfqQWucyMg72wyM9ydiCAzqSq6G0nMDJvHh56hC3Dic5mHzmqjAAAAAElFTkSuQmCC"/><element name="sliderThumbCapBottom" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAECAYAAACQli8lAAAAUElEQVR42q3NoREAIQwEwHSYJjOo1IBIDfEx+EgEDMfLVwyCbWDphoig1gp3R2sNmYneO+acWGuBXimlxCEKekVV+RAxvWRm/EXxi2KMcZ1sxLJpnEUZrv0AAAAASUVORK5CYII="/><element name="sliderThumbCapTop" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAECAYAAACQli8lAAAAUklEQVR42q3NoREAIQwFUTpMk0wUNSBSAz4mPhIBk8/JUwwiW8C+8pqI0BhDzQzujjmnrrWoZNZao947Pgg/CHtvREQexsx6gTQNqrXiAuHlcQDl9mmceNYnwwAAAABJRU5ErkJggg=="/></elements></component><component name="tooltip"><settings><setting name="fontcase" value="normal"/><setting name="fontcolor" value="0xcccccc"/><setting name="fontsize" value="12"/><setting name="fontweight" value="normal"/><setting name="activecolor" value="0xffffff"/><setting name="overcolor" value="0xffffff"/></settings><elements><element name="arrow" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAA6UlEQVR42oWQPQoCMRCFs79E2ZBddmE321lYWNl6ARE8ip0HsLXzGLYewc7eVrD2HM6DCepgdgMPhpn35SWj6ExIc+fcs+/715DggZcZVZCWdV1fxkB44AXjExd5nu/HQHjg9YkZyZE2TdPcQhBm8MDLjIpJBk8wxpxCIGbwwMuMiviGnrTtuu4hIfQwY0/GjPKplrSy1p4liB5m7Ik95FOn+HiSJDsJoocZeyIBfpZEa796CPX3UiT4sySt9cGDqOVScEKp67Zt7xDqUJpMLfCfsiyPEGr0RFowtSLNWJVIG4RTkmal/6A3CFpZ6VvSynIAAAAASUVORK5CYII="/><element name="background" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGCAYAAADgzO9IAAAAHUlEQVQI12PR1tb+xIAFsPz794+B1hL////HKgEAHGQQccpfnGMAAAAASUVORK5CYII="/><element name="capTop" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGCAYAAADgzO9IAAAAJ0lEQVQI12NhYGDgY8ACWIBYG6uEkZHRTqwS//79YyBN4v///1glAFDoCpKnq7HaAAAAAElFTkSuQmCC"/><element name="capBottom" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGCAYAAADgzO9IAAAAIElEQVQI12NUUFD4xIAFsPz794+BOhKMQGyJS4IPmwQAPmcKl0SXnxgAAAAASUVORK5CYII="/><element name="capLeft" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGCAYAAADgzO9IAAAAI0lEQVQImWNhYGDgA2JtINjJgARYYIx///4x0Fri////KBIAmrEQcaRSRtgAAAAASUVORK5CYII="/><element name="capRight" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGCAYAAADgzO9IAAAAJElEQVQIW2PR1tb+xIAErl696g6iWP79+8eADVBT4v///1glAPLTFAxW5YqfAAAAAElFTkSuQmCC"/><element name="capTopLeft" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGCAQAAABKxSfDAAAAPElEQVQIHQXBwQmAMAAEsJQeCPqwUPqwfxeyI7j/DJoERUSUKDan7lAjmns+Y6VF9PlcL0TsY30gitQG/IPCBAzR5bO1AAAAAElFTkSuQmCC"/><element name="capTopRight" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGCAQAAABKxSfDAAAARUlEQVQIHWNg4GPgZeBkYGVgZAACCwZTBi0GcQYOINf4k/4jqX4GWwYJoKzxJxAEcrWBio0+gaD+I6BiXijH6BODJQMfAO57Ef0fVtnwAAAAAElFTkSuQmCC"/><element name="capBottomLeft" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGCAQAAABKxSfDAAAAQElEQVQIHWNg4GOwlPoEgQwMvAymEo9gHE4Gbd5+GIeVQYLBlrcfJMvAwMjAwSDOoMVgymDBAASMDKwMnEC9fAA7MxCpilfqiQAAAABJRU5ErkJggg=="/><element name="capBottomRight" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGCAQAAABKxSfDAAAAP0lEQVQIHQXBuQ2AMBAAMBc3BQPBtLANjJAuEo9CdSTYMd1AWewB9FMaAbTVK4N+tvXZVBll9mmqS4bDkFIaP8g1HX7V/X2CAAAAAElFTkSuQmCC"/><element name="menuTopHD" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEYAAAAaCAYAAAAKYioIAAAB9UlEQVR42u1VParCQBC2VBTjDxaiEAtBsFEIiF1sRKzUwsoilnYRbOySG+QIewSPkCPkCDlCjrBvv8cEwr48n+AjKswHH9nd2Z3MfJnZlBgMBoPxZvB9f6MYK0p6bjK2UNHW9kttHoP39gDwA3+pPYcB+bK1M1gzihYFL07m83mgpvFgMJDX61Xu93snFQZramhrSUsaTxRvh8MhHg6Hsb5Hf9fxeMRaSEsSc/L/zfF4HJ7PZ4xtiAFRFouFh9gUjSKFEbvd7qaGSZq8CszbbrcU3J/CBErEoNfrxemZR4W5I3ywXq9RJd7lchEkil10xYT0pd2cBMQDwiS1Wg3BO/i6GD8tDFUKWK/XUclgsUAbTKdTPTAHrYEE7glDd5PMUrUkbMYzwtC6p1pIFt5CWRFOp5PsdDoO3TdCMbIsS1DFCArQzl6GJIxYLpc3jMFGoyHpfnD/URiv9Cqgj9ESCBJPcDQaRXTHmFTWUWpfrVZBuVzGPlmtViGMk0koQmvCBhFwhuh8nDBAv98PEGCr1YqbzWaSqRLARLKwVyoVCJagwlSSsMtsqUPIdrsd4U+C/WDqV9GdzWauJsyEfOrCmN1uV5AwL4dJAZpEPSgbTIWg5yTXD/nSaOadobnxqx8Gg8H4YPjMHEopLeZPlhgMBoPBeBt8ARmyelPs06YjAAAAAElFTkSuQmCC"/><element name="menuTopCC" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAaCAYAAABByvnlAAACr0lEQVR42u1WTYryQBCdpaIQ0YWIi4iICzcjDIi7uBEUBEUQFBFduY0L/3bxBh4hR8gRcoQcIUfoI/T0C9XQNAP5Nh8MmXpQpO2u6i7fq3Tlg8FgMBgMxh/A6/UKlAllUlmszLHWU5g1Jy0LaT6212jOw9OI/1QW0bpAPM418knNPPQeP+SbYK+iiZG0Wi0QKmazmbzf74kaOyZx+/0+7fV6qSmIemRWKpXk6XSS0+k0ouV4MplImPbpdDrwwTgTHITvdjucGSF+tVrJ2+0GwbAWPJ9PuV6vUyOPGHuMRiMfsTrf4XAoH4+HUOPPogiSdrtdEAkRXMyNx+M3iKP192azebfb7RSkqSnPEgTI/EiAoxaafgf02zMEORL5INzHOgkhms1mhFgUxuVykcjFFGQwGBwhAPLR+c7ncz/bqwggYlO7wgziRbVaDUE0xMNYx4FwesPeWAOZJECeIIEiEWfCP4NJ+vl8DlUsyI8hCnKhNT32ttuthDB07XmYL4ogolarSWvOo2tlafUCVCx8HS2INhKDqjZXEB9vm17ToKtIqDcy1rHoLRDPfEPU2CUBIvV2C1xvyr8wgoREjmv0DKGIWV6v14j6goRBOKpY37iyAm16j38QxEV19/v90PAH0QlEPRwOkY6lwhA4F4IsFgs0fwjm2kLi/CII4qCJ01cNyBLoGWi0IL1SqUCQo+GfoLkbgljIF4R+L3EWnZmdr6of/SKxY8lXGldWqGPpGRrXbiHgqD+bXQnlchlVKur1uq8I9Ih08/PTbTQaiSIsyBHEpS+hQAuPLyQSRGOJK4eqO9Gk2rG6caNIdK/AOvJVeSIG8fAvHFBhniGAQ3M2XFh+IyU/hZz9PMznxGo/x/LxsieDwWAwGH8IL7ZfZFLKL7bfYx8MBoPBYDAYjP+Ab8y4ZA7nGBW+AAAAAElFTkSuQmCC"/><element name="menuOption" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAuElEQVR42u2SQQqGIBCF/wOU1UYUMjAiQdSTeI4O2DnmUL9PatVq3AUNPBhEPt6bmd9XL6u+77uiXHRAV9+1wvais4iEEFXor7e9xdkJiJSSjDG0LAsppWgYhgplOb2iVdi2bRRCqHLOkdb6dpo5wAPu4AyglFJVjJGstTSOI+EPF4iYD+C6rjRNExuIyJgZYgJU5b2neZ7vBWX2UrAAzAwx4QwwuLuX0no2mBlAcMY4G85hf/Wu+gNm+kvWRCvtuQAAAABJRU5ErkJggg=="/><element name="menuOptionOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAABfklEQVR42r2VTWqDUBSFG6v5KcVJsWTWaUZdRLuNbsNxt5CZ4/xsIJhAkGQJ3UBCcCA6UhBJQDDk9h04giREKQkVPpD37j3cc+/z+dD0iEirSn10s4hGHokG/iReEdIVbUVH0SMdrumlcKMYKzEUTwpT8aKwAN9N7hmMbdWKsYJnCrwpBop3MuCaxZh2KXrNpsHAPpK32+2H4zjfw+HQAXjHGoX7jDUu7FNQpxULCa7rftm2/TMajeLZbJaB8XgcYw17FLWYo58LaizfhCVVxScSl8vlYbPZSBiGEkWR7HY78TzvgD3E0L7JXO3cbpdNH8AaqoFYmqZSFIUcj0fZ7/fi+75MJpMYMYhlTre0XR1GT/GK5qNfsIjKIFY+p9NJ4jiW1Wp1QAximdODRqMgbKKyqmCSJLJYLLJrgrWW0TPYhBDI81yCIJDpdHrVcu1QMAD0DDZRGcTW63XdUJqPDSqdz+cZ+oZhNB6b+x/s+396t18Od72+/vuCvf0X8At7J48fIgP61QAAAABJRU5ErkJggg=="/><element name="menuOptionActive" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAABfklEQVR42r2VTWqDUBSFG6v5KcVJsWTWaUZdRLuNbsNxt5CZ4/xsIJhAkGQJ3UBCcCA6UhBJQDDk9h04giREKQkVPpD37j3cc+/z+dD0iEirSn10s4hGHokG/iReEdIVbUVH0SMdrumlcKMYKzEUTwpT8aKwAN9N7hmMbdWKsYJnCrwpBop3MuCaxZh2KXrNpsHAPpK32+2H4zjfw+HQAXjHGoX7jDUu7FNQpxULCa7rftm2/TMajeLZbJaB8XgcYw17FLWYo58LaizfhCVVxScSl8vlYbPZSBiGEkWR7HY78TzvgD3E0L7JXO3cbpdNH8AaqoFYmqZSFIUcj0fZ7/fi+75MJpMYMYhlTre0XR1GT/GK5qNfsIjKIFY+p9NJ4jiW1Wp1QAximdODRqMgbKKyqmCSJLJYLLJrgrWW0TPYhBDI81yCIJDpdHrVcu1QMAD0DDZRGcTW63XdUJqPDSqdz+cZ+oZhNB6b+x/s+396t18Od72+/vuCvf0X8At7J48fIgP61QAAAABJRU5ErkJggg=="/></elements></component></components></skin>' 
		this.xml = jwplayer.utils.parseXML(this.text);
		return this;
	};
})(jwplayer);
/**
 * JW Player display component
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var utils = jwplayer.utils,
		events = jwplayer.events,
		states = events.state,
		_css = utils.css,
		

		DOCUMENT = document,
		D_CLASS = ".jwdisplay",
		D_PREVIEW_CLASS = ".jwpreview",
		D_ERROR_CLASS = ".jwerror",

		/** Some CSS constants we should use for minimization **/
		JW_CSS_ABSOLUTE = "absolute",
		JW_CSS_NONE = "none",
		JW_CSS_100PCT = "100%",
		JW_CSS_HIDDEN = "hidden",
		JW_CSS_SMOOTH_EASE = "opacity .25s, background .25s, color .25s";

	
	html5.display = function(api, config) {
		var _api = api,
			_skin = api.skin,
			_display, _preview,
			_item,
			_image, _imageWidth, _imageHeight, _imageURL,
			_icons = {},
			_errorState = false,
			_completedState = false,
			_hiding,
			_button,		
			_config = utils.extend({
				backgroundcolor: '#000',
				showicons: true,
				bufferrotation: 15,
				bufferinterval: 100,
				fontcase: "",
				fontcolor: '#fff',
				overcolor: '#fff',
				fontsize: 15,
				fontweight: ""
			}, _skin.getComponentSettings('display'), config);
			_eventDispatcher = new events.eventdispatcher();
			
		utils.extend(this, _eventDispatcher);
			
		function _init() {
			_display = DOCUMENT.createElement("div");
			_display.id = _api.id + "_display";
			_display.className = "jwdisplay";
			
			_preview = DOCUMENT.createElement("div");
			_preview.className = "jwpreview";
			_display.appendChild(_preview);
			
			_api.jwAddEventListener(events.JWPLAYER_PLAYER_STATE, _stateHandler);
			_api.jwAddEventListener(events.JWPLAYER_PLAYLIST_ITEM, _itemHandler);
			_api.jwAddEventListener(events.JWPLAYER_PLAYLIST_COMPLETE, _playlistCompleteHandler);
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_ERROR, _errorHandler);

			_display.addEventListener('click', _clickHandler, false);
			
			_createIcons();
			//_createTextFields();
			
			_stateHandler({newstate:states.IDLE});
		}
		
		function _clickHandler(evt) {
			switch (_api.jwGetState()) {
			case states.PLAYING:
			case states.BUFFERING:
				_api.jwPause();
				break;
			default:
				_api.jwPlay();
				break;
			}
			_eventDispatcher.sendEvent(events.JWPLAYER_DISPLAY_CLICK);
		}
		
		function _createIcons() {
			var	outStyle = {
					font: _config.fontweight + " " + _config.fontsize + "px/"+(parseInt(_config.fontsize)+3)+"px Arial,Helvetica,sans-serif",
					color: _config.fontcolor
				},
				overStyle = {color:_config.overcolor};
			_button = new html5.displayicon(_display.id+"_button", _api, outStyle, overStyle);
			_display.appendChild(_button.element());
		}
		

		function _setIcon(name, text) {
			if (!_config.showicons) return;
			
			if (name || text) {
				_button.setRotation(name == "buffer" ? parseInt(_config.bufferrotation) : 0, parseInt(_config.bufferinterval));
				_button.setIcon(name);
				_button.setText(text);
			} else {
				_button.hide();
			}
			
			
		}

		function _itemHandler() {
			_item = _api.jwGetPlaylist()[_api.jwGetPlaylistIndex()];
			var newImage = _item ? _item.image : "";
			if (_image != newImage) {
				_image = newImage;
				_setVisibility(D_PREVIEW_CLASS, false);
				_getImage();
			}
		}
		
		function _playlistCompleteHandler() {
			_completedState = true;
			_setIcon("replay");
		}
		
		var _stateTimeout;
		
		function _stateHandler(evt) {
			clearTimeout(_stateTimeout);
			_stateTimeout = setTimeout(function() {
				_updateDisplay(evt.newstate);
			}, 100);
		}
		
		function _updateDisplay(state) {
			if (_button) _button.setRotation(0);
			switch(state) {
			case states.IDLE:
				if (!_errorState && !_completedState) {
					if (_image) _setVisibility(D_PREVIEW_CLASS, true);
					_setIcon('play', _item ? _item.title : "");
				}
				break;
			case states.BUFFERING:
				_clearError();
				_completedState = false;
				_setIcon('buffer');
				break;
			case states.PLAYING:
				_setIcon();
				break;
			case states.PAUSED:
				_setIcon('play');
				break;
			}
		}
		
		this.hidePreview = function(state) {
			_setVisibility(D_PREVIEW_CLASS, !state);
		}

		this.element = function() {
			return _display;
		}
		
		function _internalSelector(selector) {
			return '#' + _display.id + ' ' + selector;
		}
		
		function _getImage() {
			if (_image) {
				// Find image size and stretch exactfit if close enough
				var img = new Image();
				img.addEventListener('load', _imageLoaded, false);
				img.src = _image;
			} else {
				_css(_internalSelector(D_PREVIEW_CLASS), { 'background-image': undefined });
				_setVisibility(D_PREVIEW_CLASS, false);
				_imageWidth = _imageHeight = 0;
			}
		}
		
		function _imageLoaded() {
			_imageWidth = this.width;
			_imageHeight = this.height;
			_redraw();
			if (_image) {
				_css(_internalSelector(D_PREVIEW_CLASS), {
					'background-image': 'url('+_image+')' 
				});
			}
		}

		function _errorHandler(evt) {
			_errorState = true;
			_setIcon('error', evt.message);
		}
		
		function _clearError() {
			_errorState = false;
			if (_icons.error) _icons.error.setText();
		}

		
		function _redraw() {
			utils.stretch(_api.jwGetStretching(), _preview, _display.clientWidth, _display.clientHeight, _imageWidth, _imageHeight);
		}

		this.redraw = _redraw;
		
		function _setVisibility(selector, state) {
			_css(_internalSelector(selector), {
				opacity: state ? 1 : 0,
				visibility: state ? "visible" : "hidden"
			});
		}

		this.show = function() {
			_setVisibility('', true);
		}
		
		this.hide = function() {
			_setVisibility('', false);
		}

		this.getBGColor = function() {
			return _config.backgroundcolor;
		}
		
		/** NOT SUPPORTED : Using this for now to hack around instream API **/
		this.setAlternateClickHandler = function(handler) {
			_alternateClickHandler = handler;
		}
		this.revertAlternateClickHandler = function() {
			_alternateClickHandler = undefined;
		}

		_init();
	};
	
	_css(D_CLASS, {
		position: JW_CSS_ABSOLUTE,
		cursor: "pointer",
		width: JW_CSS_100PCT,
		height: JW_CSS_100PCT,
		overflow: JW_CSS_HIDDEN,
		opacity: 0
	});

	_css(D_CLASS + ' .jwpreview', {
		position: JW_CSS_ABSOLUTE,
		width: JW_CSS_100PCT,
		height: JW_CSS_100PCT,
		background: 'no-repeat center',
		overflow: JW_CSS_HIDDEN
	});

	_css(D_CLASS +', '+D_CLASS + ' *', {
    	'-webkit-transition': JW_CSS_SMOOTH_EASE,
    	'-moz-transition': JW_CSS_SMOOTH_EASE,
    	'-o-transition': JW_CSS_SMOOTH_EASE
	});

})(jwplayer.html5);/**
 * JW Player display component
 * 
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var utils = jwplayer.utils, 
		events = jwplayer.events, 
		states = events.state, 
		_css = utils.css,

		DI_CLASS = ".jwdisplayIcon", 
		UNDEFINED = undefined,
		DOCUMENT = document,

		/** Some CSS constants we should use for minimization * */
		JW_CSS_NONE = "none", 
		JW_CSS_100PCT = "100%",
		JW_CSS_CENTER = "center",
		JW_CSS_ABSOLUTE = "absolute";

	html5.displayicon = function(id, api, textStyle, textStyleOver) {
		var _api = api,
			_skin = _api.skin,
			_id = id,
			_container, 
			_bg,
			_text, 
			_icon,
			_iconWidth = 0;

		function _init() {
			_container = _createElement("jwdisplayIcon");
			_container.id = _id;

			_createElement('capLeft', _container);
			_bg = _createElement('background', _container);
			_text = _createElement('text', _container, textStyle, textStyleOver);
			_icon = _createElement('icon', _container);
			_createElement('capRight', _container);

			_css(_internalSelector('div'), {
				height : _getSkinElement('background').height
			});

			_redraw();
		}

		function _internalSelector(selector, hover) {
			return "#" + _id + (hover ? ":hover" : "") + " " + (selector ? selector : "");
		}

		function _createElement(name, parent, style, overstyle) {
			var elem = DOCUMENT.createElement("div");

			elem.className = name;
			if (parent) parent.appendChild(elem);

			_styleIcon(name, "."+name, style, overstyle);
			
			return elem;
		}
		
		function _styleIcon(name, selector, style, overstyle) {
			var skinElem = _getSkinElement(name), 
				overElem = _getSkinElement(name + "Over");

			style = utils.extend( {}, style);
			if (name.indexOf("Icon") > 0) _iconWidth = skinElem.width;
			if (skinElem.src) {
				_show();
				style['background-image'] = 'url(' + skinElem.src + ')';
				style['width'] = skinElem.width;
			}
			_css(_internalSelector(selector), style);

			overstyle = utils.extend( {}, overstyle);
			if (overElem.src) {
				overstyle['background-image'] = 'url(' + overElem.src + ')';
			}
			_css("#"+_api.id+" .jwdisplay:hover " + selector, overstyle);
		}

		function _getSkinElement(name) {
			var elem = _skin.getSkinElement('display', name);
			if (elem) {
				return elem;
			}
			return { src : "", width : 0, height : 0 };
		}
		
		var _redraw = this.redraw = function() {
			var bgSkin = _getSkinElement('background'),
				capLeftSkin = _getSkinElement('capLeft'),
				capRightSkin = _getSkinElement('capRight'),
				hasCaps = (capLeftSkin.width * capRightSkin.width > 0),
				showText = hasCaps || (_iconWidth == 0);
			
			_css(_internalSelector(), {
				'margin-top': bgSkin.height / -2,
				height: bgSkin.height,
				width : undefined
			});
			_css(_internalSelector('.background'), {
				'background-repeat': 'repeat-x',
				'background-size': JW_CSS_100PCT + " " + bgSkin.height + "px",
				position: "absolute",
				width: hasCaps ? UNDEFINED : showText ? "100%" : bgSkin.width,
				'margin-left': !showText ? (bgSkin.width - _iconWidth) / -2 : UNDEFINED,
				left: hasCaps ? capLeftSkin.width : UNDEFINED,
				right: hasCaps ? capRightSkin.width : UNDEFINED
			});
			_css(_internalSelector(".capLeft") + ","+ _internalSelector(".capRight"), {
				display: hasCaps ? UNDEFINED : JW_CSS_NONE
			})
			_css(_internalSelector('.text'), {
				display: (_text.innerHTML && showText) ? UNDEFINED : JW_CSS_NONE,
				padding: hasCaps ? 0 : "0 10px"
			});

		}
		
		this.element = function() {
			return _container;
		}

		this.setText = function(text) {
			var style = _text.style;
			_text.innerHTML = text ? text.replace(":", ":<br>") : "";
			_redraw();
			style.height = "0";
			style.display = "block";
			while (numLines(_text) > 2) {
				_text.innerHTML = _text.innerHTML.replace(/(.*) .*$/, "$1...");
			}
			style.height = "";
			style.display = "";
		}
		
		this.setIcon = function(name) {
			var newIcon = _createElement('icon');
			newIcon.id = _container.id + "_" + name;
			_styleIcon(name+"Icon", "#"+newIcon.id)
			_container.replaceChild(newIcon, _icon);
			_icon = newIcon;
		}

		var _bufferInterval, _bufferAngle = 0, _currentAngle;
		
		function startRotation(angle, interval) {
			clearInterval(_bufferInterval);
			_currentAngle = 0
			_bufferAngle = angle;
			if (angle == 0) {
				rotateIcon();
			} else {
				_bufferInterval = setInterval(rotateIcon, interval)
			}
		}

		function rotateIcon() {
			_currentAngle = (_currentAngle + _bufferAngle) % 360;
			utils.rotate(_icon, _currentAngle);
		}

		this.setRotation = startRotation;
						
		function numLines(element) {
			return Math.floor(element.scrollHeight / DOCUMENT.defaultView.getComputedStyle(element, null).lineHeight.replace("px", ""));
		}

		
		this.hide = function() {
			_container.style.opacity = 0;
			// Needed for IE9 for some reason
			if (_bg && utils.isIE()) _bg.style.opacity = 0;
		}

		var _show = this.show = function() {
			_container.style.opacity = 1;
			if (_bg && utils.isIE()) _bg.style.opacity = 1;
		}

		_init();
	};

	_css(DI_CLASS, {
		display : 'table',
		cursor : 'pointer',
    	position: "relative",
    	'margin-left': "auto",
    	'margin-right': "auto",
    	top: "50%"
	});

	_css(DI_CLASS + " div", {
		position : "relative",
		display: "table-cell",
		'vertical-align': "middle",
		'background-repeat' : "no-repeat",
		'background-position' : JW_CSS_CENTER
	});

	_css(DI_CLASS + " .text", {
		color : "#fff",
		'max-width' : "300px",
		'overflow-y' : "hidden",
		'text-align': JW_CSS_CENTER,
		'-webkit-user-select' : JW_CSS_NONE,
		'-moz-user-select' : JW_CSS_NONE,
		'-ms-user-select' : JW_CSS_NONE,
		'user-select' : JW_CSS_NONE
	});

})(jwplayer.html5);/**
 * JW Player display component
 * 
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var utils = jwplayer.utils, 
		events = jwplayer.events, 
		states = events.state, 
		_css = utils.css,
		_bounds = utils.bounds,

		D_CLASS = ".jwdock", 
		UNDEFINED = undefined,
		DOCUMENT = document,

		/** Some CSS constants we should use for minimization * */
		JW_CSS_NONE = "none", 
		JW_CSS_100PCT = "100%",
		JW_CSS_CENTER = "center",
		JW_CSS_ABSOLUTE = "absolute";

	html5.dock = function(api, config) {
		var _api = api,
			_defaults = {
				iconalpha: 0.8,
				iconalphaactive: 0.5,
				iconalphaover: 1,
				margin: 8
			},
			_config = utils.extend({}, _defaults, config), 
			_id = _api.id + "_dock",
			_skin = _api.skin,
			_height,
			_buttonCount = 0,
			_buttons = {},
			_tooltips = {},
			_container; 

		function _init() {
			this.visible = false;
			
			_container = _createElement("div", "jwdock");
			_container.id = _id;

			_setupElements();

			_redraw();
		}
		
		function _setupElements() {
			var button = _getSkinElement('button'),
				buttonOver = _getSkinElement('buttonOver'),
				buttonActive = _getSkinElement('buttonActive');
			
			if (!button) return;
			
			_css(_internalSelector(), {
				height: button.height,
				padding: _config.margin
			});

			_css(_internalSelector("button"), {
				width: button.width,
				cursor: "pointer",
				border: "none",
				background: button.src
			});
			
			if (buttonOver.src) _css(_internalSelector("button:hover"), { background: buttonOver.src });
			if (buttonActive.src) _css(_internalSelector("button:active"), { background: buttonActive.src });
			_css(_internalSelector("button>div"), { opacity: _config.iconalpha });
			_css(_internalSelector("button:hover>div"), { opacity: _config.iconalphaover });
			_css(_internalSelector("button:active>div"), { opacity: _config.iconalphaactive});
			_css(_internalSelector(".jwoverlay"), { top: button.height });
			
			_createImage("capLeft", _container);
			_createImage("capRight", _container);
			_createImage("divider");
		}
		
		function _createImage(className, parent) {
			var skinElem = _getSkinElement(className);
			_css(_internalSelector("." + className), {
				width: skinElem.width,
				background: skinElem.src
			});
			return _createElement("div", className, parent);
		}
		
		function _internalSelector(selector, hover) {
			return "#" + _id + " " + (selector ? selector : "");
		}

		function _createElement(type, name, parent) {
			var elem = DOCUMENT.createElement(type);
			if (name) elem.className = name;
			if (parent) parent.appendChild(elem);
			return elem;
		}
		
		function _getSkinElement(name) {
			var elem = _skin.getSkinElement('dock', name);
			if (elem) return elem;
			return { width: 0, height: 0, src: "" }
		}

		var _redraw = this.redraw = function() {
		}
		
		function _positionTooltip(name) {
			var tooltip = _tooltips[name],
				tipBounds,
				button = _buttons[name],
				buttonBounds = _bounds(button.icon),
				dockBounds = _bounds(_container);

			tooltip.offsetX(0);
			_css('#' + tooltip.element().id, {
				left: buttonBounds.left - dockBounds.left + buttonBounds.width / 2
			});
			tipBounds = _bounds(tooltip.element());
			if (dockBounds.left > tipBounds.left) {
				tooltip.offsetX(dockBounds.left - tipBounds.left);
			}

		}
	
		this.element = function() {
			return _container;
		}
		
		this.offset = function(offset) {
			_css(_internalSelector(), { 'margin-left': offset });
		}

		this.hide = function() {
			this.visible = false;
			_css(_internalSelector(), {
				opacity: 0
			});
		}

		this.show = function() {
			this.visible = true;
			_css(_internalSelector(), {
				visibility: "visible",
				opacity: 1
			});
		}
		
		this.addButton = function(url, label, clickHandler, id) {
			// Can't duplicate button ids
			if (_buttons[id]) return;
			
			var divider = _createElement("div", "divider", _container),
				newButton = _createElement("button", null, _container),
				icon = _createElement("div", null, newButton);
		
			icon.id = _id + "_" + id;
			icon.innerHTML = "&nbsp;"
			_css("#"+icon.id, {
				'background-image': url
			});
			
			if (typeof clickHandler == "string") {
				clickHandler = new Function(clickHandler);
			}
			newButton.addEventListener("click", clickHandler);
			
			_buttons[id] = { element: newButton, label: label, divider: divider, icon: icon };
			
			if (label) {
				var tooltip = new html5.overlay(icon.id+"_tooltip", _skin, true),
					tipText = _createElement("div");
				tipText.innerHTML = label;
				tooltip.setContents(tipText);
				
				var timeout;
				newButton.addEventListener('mouseover', function() { 
					clearTimeout(timeout); 
					_positionTooltip(id); 
					tooltip.show();
					for (var i in _tooltips) {
						if (i != id) {
							_tooltips[i].hide();
						}
					}
				}, false);
				newButton.addEventListener('mouseout', function() {
					timeout = setTimeout(tooltip.hide, 100); 
				} , false);
				
				_container.appendChild(tooltip.element());
				_tooltips[id] = tooltip;
			}
			
			_buttonCount++;
			_setCaps();
		}
		
		this.removeButton = function(id) {
			if (_buttons[id]) {
				_container.removeChild(_buttons[id].element);
				_container.removeChild(_buttons[id].divider);
				delete _buttons[id];
				_buttonCount--;
				_setCaps();
			}
		}
		
		function _setCaps() {
			_css(D_CLASS + " .capLeft, " + D_CLASS + " .capRight", {
				display: _buttonCount ? "block" : "none"
			});
		}

		_init();
	};

	_css(D_CLASS, {
	  	position: "absolute",
	  	visibility: "hidden",
	  	opacity: 0
//	  	overflow: "hidden"
	});
	
	
	_css(D_CLASS + " button", {
		position: "relative",
	});
	
	_css(D_CLASS + " > *", {
		height: "100%",
	  	'float': "left"
	});

	_css(D_CLASS + " > .jwoverlay", {
		height: 'auto',
	  	'float': "none"
	});

	_css(D_CLASS + " .divider", {
		display: "none"
	});

	_css(D_CLASS + " button ~ .divider", {
		display: "block"
	});

	_css(D_CLASS + " .capLeft, " + D_CLASS + " .capRight", {
		display: "none"
	});

	_css(D_CLASS + " .capRight", {
		'float': "right"
	});
	
	_css(D_CLASS + " button > div", {
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
		margin: 5,
		position: "absolute",
		'background-size': "contain",
		'background-position': "center",
		'background-repeat': "no-repeat"
	});

	utils.transitionStyle(D_CLASS, "background .15s, opacity .15s");
	utils.transitionStyle(D_CLASS + " button div", "opacity .15s");
	utils.transitionStyle(D_CLASS + " .jwoverlay", "opacity .15s");

})(jwplayer.html5);/** 
 * API to control instream playback without interrupting currently playing video
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var _jw = jwplayer, 
		_utils = _jw.utils, 
		_events = _jw.events, 
		_states = _events.state,
		_playlist = _jw.playlist;
	
	html5.instream = function(api, model, view, controller) {
		var _defaultOptions = {
			controlbarseekable:"always",
			controlbarpausable:true,
			controlbarstoppable:true,
			playlistclickable:true
		};
		
		var _item,
			_options,
			_api=api, _model=model, _view=view, _controller=controller,
			_video, _oldsrc, _oldsources, _oldpos, _oldstate, _olditem,
			_provider, _cbar, _disp, _instreamMode = false,
			_dispatcher, _instreamContainer,
			_self = this;


		/*****************************************
		 *****  Public instream API methods  *****
		 *****************************************/

		/** Load an instream item and initialize playback **/
		this.load = function(item, options) {
			// Update the instream player's model
			_copyModel();
			// Sets internal instream mode to true
			_instreamMode = true;
			// Instream playback options
			_options = _utils.extend(_defaultOptions, options);
			// Copy the playlist item passed in and make sure it's formatted as a proper playlist item
			_item = new _playlist.item(item);
			// Create (or reuse) video media provider.  No checks right now to make sure it's a valid playlist item (i.e. provider="video").
			_setupProvider();
			// Create the container in which the controls will be placed
			_instreamContainer = document.createElement("div");
			_instreamContainer.id = _self.id + "_instream_container";
			// Make sure the original player's provider stops broadcasting events (pseudo-lock...)
			_controller.detachMedia();
			// Get the video tag
			_video = _provider.getTag();
			// Store this to compare later (in case the main player switches to the next playlist item when we switch out of instream playback mode 
			_olditem = _model.playlist[_model.item];
			// Keep track of the original player state
			_oldstate = _api.jwGetState();
			// If the player's currently playing, pause the video tag
			if (_oldstate == _states.BUFFERING || _oldstate == _states.PLAYING) {
				_video.pause();
			}
			
			// Copy the video src/sources tags and store the current playback time
			_oldsrc = _video.src ? _video.src : _video.currentSrc;
			_oldsources = _video.innerHTML;
			_oldpos = _video.currentTime;
			
			// Instream display component
			_disp = new html5.display(_self);
			_disp.setAlternateClickHandler(function(evt) {
				if (_fakemodel.state == _states.PAUSED) {
					_self.jwInstreamPlay();
				} else {
					_sendEvent(_events.JWPLAYER_INSTREAM_CLICK, evt);
				}
			});
			_instreamContainer.appendChild(_disp.element());

			// Instream controlbar (if not iOS/Android)
			if (!_utils.isMobile()) {
//				_cbar = new html5.controlbar(_self, _utils.extend({},_model.plugins.config.controlbar, {}));
				_cbar = new html5.controlbar(_self);
//				if (_model.plugins.config.controlbar.position == html5.view.positions.OVER) {
					_instreamContainer.appendChild(_cbar.element());
//				} else {
//					var cbarParent = _model.plugins.object.controlbar.getDisplayElement().parentNode;
//					cbarParent.appendChild(_cbar.getDisplayElement());
//				}
			}

			// Show the instream layer
			_view.setupInstream(_instreamContainer, _video);
			// Resize the instream components to the proper size
			_resize();
			// Load the instream item
			_provider.load(_item);
			
		}
			
		/** Stop the instream playback and revert the main player back to its original state **/
		this.jwInstreamDestroy = function(complete) {
			if (!_instreamMode) return;
			// We're not in instream mode anymore.
			_instreamMode = false;
			if (_oldstate != _states.IDLE) {
				// Load the original item into our provider, which sets up the regular player's video tag
				_provider.load(_olditem, false);
				// We don't want the position interval to be running anymore
				//_provider.stop(false);
			} else {
				_provider.stop(true);
			}
			// We don't want the instream provider to be attached to the video tag anymore
			_provider.detachMedia();
			// Return the view to its normal state
			_view.destroyInstream();
			// If we added the controlbar anywhere, let's get rid of it
			if (_cbar) try { _cbar.element().parentNode.removeChild(_cbar.getDisplayElement()); } catch(e) {}
			// Let listeners know the instream player has been destroyed, and why
			_sendEvent(_events.JWPLAYER_INSTREAM_DESTROYED, {reason:(complete ? "complete":"destroyed")}, true);
			// Re-attach the controller
			_controller.attachMedia();
			if (_oldstate == _states.BUFFERING || _oldstate == _states.PLAYING) {
				// Model was already correct; just resume playback
				_video.play();
				if (_model.playlist[_model.item] == _olditem) {
					// We need to seek using the player's real provider, since the seek may have to be delayed
					//_model.getMedia().seek(_oldpos);
					_model.getVideo().seek(_oldpos);
				}
			}
			return;
		};
		
		/** Forward any calls to add and remove events directly to our event dispatcher **/
		this.jwInstreamAddEventListener = function(type, listener) {
			_dispatcher.addEventListener(type, listener);
		} 
		this.jwInstreamRemoveEventListener = function(type, listener) {
			_dispatcher.removeEventListener(type, listener);
		}

		/** Start instream playback **/
		this.jwInstreamPlay = function() {
			if (!_instreamMode) return;
			_provider.play(true);
		}

		/** Pause instream playback **/
		this.jwInstreamPause = function() {
			if (!_instreamMode) return;
			_provider.pause(true);
		}
		
		/** Seek to a point in instream media **/
		this.jwInstreamSeek = function(position) {
			if (!_instreamMode) return;
			_provider.seek(position);
		}
		
		/** Get the current instream state **/
		this.jwInstreamGetState = function() {
			if (!_instreamMode) return undefined;
			return _fakemodel.state;
		}

		/** Get the current instream playback position **/
		this.jwInstreamGetPosition = function() {
			if (!_instreamMode) return undefined;
			return _fakemodel.position;
		}

		/** Get the current instream media duration **/
		this.jwInstreamGetDuration = function() {
			if (!_instreamMode) return undefined;
			return _fakemodel.duration;
		}
		
		this.playlistClickable = function() {
			return (!_instreamMode || _options.playlistclickable.toString().toLowerCase()=="true");
		}
		

		/*****************************
		 ****** Private methods ****** 
		 *****************************/

		function _init() {
			// Initialize the instream player's model copied from main player's model
			//_fakemodel = new html5.model(this, _model.getMedia() ? _model.getMedia().getDisplayElement() : _model.container, _model);
			_fakemodel = new html5.model({});
			// Create new event dispatcher
			_dispatcher = new _events.eventdispatcher();
			// Listen for player resize events
			_api.jwAddEventListener(_events.JWPLAYER_RESIZE, _resize);
			_api.jwAddEventListener(_events.JWPLAYER_FULLSCREEN, _resize);
		}

		function _copyModel() {
			_controller.setMute(_model.mute);
			_controller.setVolume(_model.volume);
		}
		
		function _setupProvider() {
			if (!_provider) {
//				_provider = new html5.mediavideo(_fakemodel, _model.getMedia() ? _model.getMedia().getDisplayElement() : _model.container);
				_provider = new html5.video(_model.getVideo().getTag());
				_provider.addGlobalListener(_forward);
				_provider.addEventListener(_events.JWPLAYER_MEDIA_META, _metaHandler);
				_provider.addEventListener(_events.JWPLAYER_MEDIA_COMPLETE, _completeHandler);
				_provider.addEventListener(_events.JWPLAYER_MEDIA_BUFFER_FULL, _bufferFullHandler);
			}
			_provider.attachMedia();
		}
		
		/** Forward provider events to listeners **/		
		function _forward(evt) {
			if (_instreamMode) {
				_sendEvent(evt.type, evt);
			}
		}
		
		/** Handle the JWPLAYER_MEDIA_BUFFER_FULL event **/		
		function _bufferFullHandler(evt) {
			if (_instreamMode) {
				_provider.play();
			}
		}

		/** Handle the JWPLAYER_MEDIA_COMPLETE event **/		
		function _completeHandler(evt) {
			if (_instreamMode) {
				setTimeout(function() {
					_self.jwInstreamDestroy(true);
				}, 10);
			}
		}

		/** Handle the JWPLAYER_MEDIA_META event **/		
		function _metaHandler(evt) {
			// If we're getting video dimension metadata from the provider, allow the view to resize the media
			if (evt.metadata.width && evt.metadata.height) {
				_view.resizeMedia();
			}
		}
		
		function _sendEvent(type, data, forceSend) {
			if (_instreamMode || forceSend) {
				_dispatcher.sendEvent(type, data);
			}
		}
		
		// Resize handler; resize the components.
		function _resize() {
//			var originalDisp = _model.plugins.object.display.getDisplayElement().style;
//			
			if (_cbar) {
//				var originalBar = _model.plugins.object.controlbar.getDisplayElement().style;
				_cbar.redraw();
				//_cbar.resize(_utils.parseDimension(originalDisp.width), _utils.parseDimension(originalDisp.height));
//				_css(_cbar.getDisplayElement(), _utils.extend({}, originalBar, { zIndex: 1001, opacity: 1 }));
			}
			if (_disp) {
//				
//				_disp.resize(_utils.parseDimension(originalDisp.width), _utils.parseDimension(originalDisp.height));
				_disp.redraw();
//				_css(_disp.getDisplayElement(), _utils.extend({}, originalDisp, { zIndex: 1000 }));
			}
//			if (_view) {
//				_view.resizeMedia();
//			}
		}
		
		
		/**************************************
		 *****  Duplicate main html5 api  *****
		 **************************************/
		
		this.jwPlay = function(state) {
			if (_options.controlbarpausable.toString().toLowerCase()=="true") {
				this.jwInstreamPlay();
			}
		};
		
		this.jwPause = function(state) {
			if (_options.controlbarpausable.toString().toLowerCase()=="true") {
				this.jwInstreamPause();
			}
		};

		this.jwStop = function() {
			if (_options.controlbarstoppable.toString().toLowerCase()=="true") {
				this.jwInstreamDestroy();
				_api.jwStop();
			}
		};

		this.jwSeek = function(position) {
			switch(_options.controlbarseekable.toLowerCase()) {
			case "always":
				this.jwInstreamSeek(position);
				break;
			case "backwards":
				if (_fakemodel.position > position) {
					this.jwInstreamSeek(position);
				}
				break;
			}
		};
		
		this.jwGetPosition = function() {};
		this.jwGetDuration = function() {};
		this.jwGetWidth = _api.jwGetWidth;
		this.jwGetHeight = _api.jwGetHeight;
		this.jwGetFullscreen = _api.jwGetFullscreen;
		this.jwSetFullscreen = _api.jwSetFullscreen;
		this.jwGetVolume = function() { return _model.volume; };
		this.jwSetVolume = function(vol) {
			_provider.volume(vol);
			_api.jwSetVolume(vol);
		}
		this.jwGetMute = function() { return _model.mute; };
		this.jwSetMute = function(state) {
			_provider.mute(state);
			_api.jwSetMute(state);
		}
		this.jwGetState = function() { return _fakemodel.state; };
		this.jwGetPlaylist = function() { return [_item]; };
		this.jwGetPlaylistIndex = function() { return 0; };
		this.jwGetStretching = function() { return _model.config.stretching; };
		this.jwAddEventListener = function(type, handler) { _dispatcher.addEventListener(type, handler); };
		this.jwRemoveEventListener = function(type, handler) { _dispatcher.removeEventListener(type, handler); };

		this.skin = _api.skin;
		this.id = _api.id + "_instream";

		_init();
		return this;
	};
})(jwplayer.html5);

/**
 * JW Player logo component
 *
 * @author zach
 * @modified pablo
 * @version 6.0
 */
(function(jwplayer) {
	var utils = jwplayer.utils,
		html5 = jwplayer.html5,
		_css = utils.css,
	
		_defaults = {
			prefix: "http://l.longtailvideo.com/html5/",
			file: "logo.png",
			link: "http://www.longtailvideo.com/players/jw-flv-player/",
			linktarget: "_top",
			margin: 8,
//			out: 0.5,
//			over: 1,
//			timeout: 5,
			hide: true,
			position: "top-right"
		},
		
		UNDEFINED = undefined,
		
		JW_CSS_VISIBLE = "visible",
		JW_CSS_HIDDEN = "hidden",
		LOGO_CLASS = ".jwlogo";
	
	
	html5.logo = function(api, logoConfig) {
		var _api = api,
			_id = _api.id + "_logo",
			_settings,
			_logo,
			_showing = false;
		
		function _setup() {
			_setupConfig();
			_setupDisplayElements();
			//_setupMouseEvents();
		}
		
		function _setupConfig() {
			if (_defaults.prefix) {
				var version = jwplayer.version.split(/\W/).splice(0, 2).join("/");
				if (_defaults.prefix.indexOf(version) < 0) {
					_defaults.prefix += version + "/";
				}
			}
			try {
				if (window.location.href.indexOf("https") == 0) {
					_defaults.prefix = _defaults.prefix.replace("http://l.longtailvideo.com", "https://securel.longtailvideo.com");
				}
			} catch(e) {}
			
			_settings = utils.extend({}, _defaults, logoConfig);
			_settings.hide = (_settings.hide.toString() == "true");
		}
		
		function _setupDisplayElements() {
			_logo = document.createElement("img");
			_logo.className = "jwlogo";
			_logo.id = _id;
			
			if (!_settings.file) {
				return;
			}
			
			var positions = (/(\w+)-(\w+)/).exec(_settings.position),
				style = {
					opacity: _settings.hide ? UNDEFINED : 1,
					visibility: _settings.hide ? UNDEFINED : JW_CSS_VISIBLE
				},
				margin = _settings.margin;

			if (positions.length == 3) {
				style[positions[1]] = margin;
				style[positions[2]] = margin;
			} else {
				style.top = style.right = margin;
			}

			_css(_internalSelector(), style); 
			
			if (_settings.file.indexOf("/") >= 0) {
				_logo.src = _settings.file;
			} else {
				_logo.src = _settings.prefix + _settings.file;
			}
			
			_logo.onclick = _clickHandler;
		}
		
		this.resize = function(width, height) {
		};
		
		this.element = function() {
			return _logo;
		};
		
//		function _setupMouseEvents() {
//			if (_settings.link) {
//				
//			}
//		}
//		
		this.offset = function(offset) {
			_css(_internalSelector(), { 'margin-bottom': offset }); 
		}
		
		this.position = function() {
			return _settings.position;
		}

		this.margin = function() {
			return parseInt(_settings.margin);
		}

		function _clickHandler(evt) {
			if (utils.exists(evt)) {
				evt.stopPropagation();
			}
			
			if (_showing && _settings.link) {
				_api.jwPause();
				_api.jwSetFullscreen(false);
				window.open(_settings.link, _settings.linktarget);
			}
			return;
		}
		
		function _internalSelector(selector) {
			return "#" + _id + " " + (selector ? selector : "");
		}
		
		this.hide = function() {
			if (_settings.hide) {
				_showing = false;
				_css(_internalSelector(), {
					opacity: 0,
					visibility: JW_CSS_HIDDEN,
				});
			}
		}

		this.show = function() {
			_showing = true;
			_css(_internalSelector(), {
				visibility: JW_CSS_VISIBLE,
				opacity: 1
			});
		}
		
		_setup();
		
		return this;
	};
	
	_css(LOGO_CLASS, {
		cursor: "pointer",
	  	position: "absolute",
	  	visibility: JW_CSS_HIDDEN,
	  	opacity: 0
	});

	utils.transitionStyle(LOGO_CLASS, "visibility .15s, opacity .15s");

})(jwplayer);
/**
 * JW Player HTML5 overlay component
 * 
 * @author pablo
 * @version 6.0
 */
(function(jwplayer) {
	
	var html5 = jwplayer.html5,
		utils = jwplayer.utils,
		_css = utils.css,
		
		MENU_CLASS = 'jwmenu',
		OPTION_CLASS = 'jwoption',
		UNDEFINED = undefined,
		WHITE = '#ffffff';
	
	/** HTML5 Overlay class **/
	html5.menu = function(name, id, skin, changeHandler) {
		var _skin = skin,
			_name = name,
			_id = id,
			_changeHandler = changeHandler,
			_overlay = new html5.overlay(_id+"_overlay", skin),
			_settings = utils.extend({
				fontcase: UNDEFINED,
				fontcolor: WHITE,
				fontsize: 12,
				fontweight: UNDEFINED,
				activecolor: WHITE,
				overcolor: WHITE
			}, skin.getComponentSettings('tooltip')),
			_container,
			_options = [];
		
		function _init() {
			_container = _createElement(MENU_CLASS);
			_container.id = _id;
			
			var top = _getSkinElement('menuTop'+name),
				menuOption = _getSkinElement('menuOption'),
				menuOptionOver = _getSkinElement('menuOptionOver'),
				menuOptionActive = _getSkinElement('menuOptionOver');

			if (top) {
				_container.appendChild(top.image);
			}
			
			if (menuOption) {
				var selector = '#'+id+' .'+OPTION_CLASS;
				_css(selector, {
					'background-image': menuOption.src,
					height: menuOption.height,
					color: _settings.fontcolor,
					'padding-left': menuOption.width,
					font: _settings.fontweight + " " + _settings.fontsize + "px Arial,Helvetica,sans-serif",
					'text-transform': (_settings.fontcase == "upper") ? "uppercase" : UNDEFINED 
				});
				_css(selector+":hover", {
					'background-image': menuOptionOver.src ? menuOptionOver.src : UNDEFINED,
					color: _settings.overcolor
				});
				_css(selector+".active", {
					'background-image': menuOptionActive.src ? menuOptionActive.src : UNDEFINED,
					color: _settings.activecolor
				});
			}
			_overlay.setContents(_container);
		}
		
		this.element = function() {
			return _overlay.element();
		};
		
		this.addOption = function(label, value) {
			var option = _createElement(OPTION_CLASS, _container);
			option.id = _id+"_option_"+value;
			option.innerHTML = label;
			option.addEventListener('click', _clickHandler(_options.length, value));
			_options.push(option);
		}
		
		function _clickHandler(index, value) {
			return function() {
				_setActive(index);
				if (_changeHandler) _changeHandler(value);
			}
		}
		
		this.clearOptions = function() {
			while(_options.length > 0) {
				_container.removeChild(_options.pop());
			}
		}

		var _setActive = this.setActive = function(index) {
			for (var i = 0; i < _options.length; i++) {
				var option = _options[i];
				option.className = option.className.replace(" active", "");
				if (i == index) option.className += " active";
			}
		}
		

		function _createElement(className, parent) {
			var elem = document.createElement("div");
			if (className) elem.className = className;
			if (parent) parent.appendChild(elem);
			return elem;
		}
		
		function _getSkinElement(name) {
			var elem = skin.getSkinElement('tooltip', name);
			return elem;
		}

		this.show = _overlay.show;
		this.hide = _overlay.hide;
		this.offsetX = _overlay.offsetX;
		
		_init();
	}
	
	function _class(className) {
		return "." + className.replace(/ /g, " .");
	}
	
	_css(_class(MENU_CLASS + ' ' + OPTION_CLASS), {
		'background-repeat': "no-repeat",
		cursor: "pointer",
		position: "relative"
	});
	

})(jwplayer);/**
 * jwplayer.html5 model
 * 
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var utils = jwplayer.utils,
		events = jwplayer.events,
		UNDEF = undefined;

	html5.model = function(config) {
		var _model = this, 
			// Video provider
			_video, 
			// HTML5 <video> tag
			_videoTag,
			// Saved settings
			_cookies = utils.getCookies(),
			// Sub-component configurations
			_componentConfigs = {};
			// Defaults
			_defaults = {
				autostart: false,
				controlbar: true,
				debug: UNDEF,
				height: 320,
				icons: true,
				item: 0,
				mobilecontrols: false,
				mute: false,
				playlist: [],
				playlistposition: "right",
				playlistsize: 0,
				repeat: "list",
				skin: UNDEF,
				stretching: utils.stretching.UNIFORM,
				volume: 90,
				width: 480
			};

		function _parseConfig(config) {
			for (var i in config) {
				config[i] = utils.serialize(config[i]);
			}
			return config;
		}

		function _init() {
			utils.extend(_model, new events.eventdispatcher());
			_model.config = _parseConfig(utils.extend({}, _defaults, _cookies, config));
			utils.extend(_model, {
				id: config.id,
				state : events.state.IDLE,
				position: 0,
				buffer: 0,
			}, _model.config);
			_setComponentConfigs();
			_model.setItem(_model.config.item);
			
			_videoTag = document.createElement("video");
			_video = new html5.video(_videoTag);
			_video.volume(_model.volume);
			_video.mute(_model.mute);
			_video.addGlobalListener(_videoEventHandler);
		}
		
		function _setComponentConfigs() {
			_componentConfigs.display = { showicons: _model.icons };
			_componentConfigs.controlbar = {};
		}

		var _eventMap = {};
		_eventMap[events.JWPLAYER_MEDIA_MUTE] = "mute";
		_eventMap[events.JWPLAYER_MEDIA_VOLUME] = "volume";
		_eventMap[events.JWPLAYER_PLAYER_STATE] = "newstate->state";
		_eventMap[events.JWPLAYER_MEDIA_BUFFER] = "bufferPercent->buffer";
		_eventMap[events.JWPLAYER_MEDIA_TIME] = "position";
			
		function _videoEventHandler(evt) {
			var mapping = _eventMap[evt.type];
			if (mapping) {
				var split = mapping.split("->"),
					eventProp = split[0],
					stateProp = split[1] ? split[1] : eventProp;
				if (_model[stateProp] != evt[eventProp]) {
					_model[stateProp] = evt[eventProp];
					_model.sendEvent(evt.type, evt);
				}
			} else {
				_model.sendEvent(evt.type, evt);
			}
		}
		
		_model.getVideo = function() {
			return _video;
		}
		
		_model.seekDrag = function(state) {
			_video.seekDrag(state);
		}
		
		_model.setFullscreen = function(state) {
			if (state != _model.fullscreen) {
				_model.fullscreen = state;
				_model.sendEvent(events.JWPLAYER_FULLSCREEN, { fullscreen: state } );
			}
		}
		
		_model.setPlaylist = function(playlist) {
			_model.playlist = playlist;
			_filterPlaylist(playlist);
			_model.sendEvent(events.JWPLAYER_PLAYLIST_LOADED, {
				playlist: playlist
			});
		}

		/** Go through the playlist and choose a single playable type to play; remove sources of a different type **/
		function _filterPlaylist(playlist) {
			for (var i=0; i < playlist.length; i++) {
				playlist[i].sources = utils.filterSources(playlist[i].sources);
			}
		}
		
		_model.setItem = function(index) {
			var newItem;
			if (index == _model.playlist.length || index < -1)
				newItem = 0;
			else if (index == -1 || index > _model.playlist.length)
				newItem = _model.playlist.length - 1;
			else
				newItem = index;
			
			if (newItem != _model.item) {
				_model.item = newItem;
				_model.sendEvent(events.JWPLAYER_PLAYLIST_ITEM, {
					"index": _model.item
				});
			}
		}
		
		_model.setVolume = function(newVol) {
			if (_model.mute && newVol > 0) _model.setMute(false);
			newVol = Math.round(newVol);
			utils.saveCookie("volume", newVol);
			_video.volume(newVol);
		}

		_model.setMute = function(state) {
			if (!utils.exists(state)) state = !_model.mute;
			utils.saveCookie("mute", state);
			_video.mute(state);
		}

		_model.componentConfig = function(name) {
			return _componentConfigs[name];
		}
		
		_init();
	}
})(jwplayer.html5);
/**
 * JW Player HTML5 overlay component
 * 
 * @author pablo
 * @version 6.0
 */
(function(jwplayer) {
	
	var html5 = jwplayer.html5,
		utils = jwplayer.utils,
		_css = utils.css,
		_setTransition = utils.transitionStyle,

		/** Some CSS constants we should use for minimization **/
		JW_CSS_RELATIVE = "relative",
		JW_CSS_ABSOLUTE = "absolute",
		//JW_CSS_NONE = "none",
		//JW_CSS_BLOCK = "block",
		//JW_CSS_INLINE = "inline",
		//JW_CSS_INLINE_BLOCK = "inline-block",
		JW_CSS_HIDDEN = "hidden",
		//JW_CSS_LEFT = "left",
		//JW_CSS_RIGHT = "right",
		JW_CSS_100PCT = "100%",
		JW_CSS_SMOOTH_EASE = "opacity .15s, visibility .15s",
		
		OVERLAY_CLASS = '.jwoverlay',
		CONTENTS_CLASS = 'jwcontents',
		
		TOP = "top",
		BOTTOM = "bottom",
		RIGHT = "right",
		LEFT = "left",
		WHITE = "#ffffff",
		
		UNDEFINED = undefined,
		DOCUMENT = document,
		
		_defaults = {
			fontcase: UNDEFINED,
			fontcolor: WHITE,
			fontsize: 12,
			fontweight: UNDEFINED,
			activecolor: WHITE,
			overcolor: WHITE
		};
	
	/** HTML5 Overlay class **/
	html5.overlay = function(id, skin, inverted) {
		var _skin = skin,
			_id = id,
			_container,
			_contents,
			_offset = 0,
			_arrow,
			_inverted = inverted,
			_settings = utils.extend({}, _defaults, _skin.getComponentSettings('tooltip'));
			_borderSizes = {};
		
		function _init() {
			_container = _createElement(OVERLAY_CLASS.replace(".",""));
			_container.id = _id;

			
			_contents = _createElement(CONTENTS_CLASS, _container);
			
			_css(_internalSelector(CONTENTS_CLASS), {
				color: _settings.fontcolor,
				font: _settings.fontweight + " " + (_settings.fontsize) + "px Arial,Helvetica,sans-serif",
				'text-transform': (_settings.fontcase == "upper") ? "uppercase" : UNDEFINED
			});
			
			_createBorderElement(TOP, LEFT);
			_createBorderElement(BOTTOM, LEFT);
			_createBorderElement(TOP, RIGHT);
			_createBorderElement(BOTTOM, RIGHT);
			_createBorderElement(LEFT);
			_createBorderElement(RIGHT);
			_createBorderElement(TOP);
			_createBorderElement(BOTTOM);
			
			_createSkinElement("background", "jwback");
			_css(_internalSelector("jwback"), {
				left: _borderSizes.left,
				right: _borderSizes.right,
				top: _borderSizes.top,
				bottom: _borderSizes.bottom
			});
			
			_arrow = _createSkinElement("arrow", "jwarrow")[1];
			_css(_internalSelector("jwarrow"), {
				position: JW_CSS_ABSOLUTE,
				bottom: _inverted ? UNDEFINED : -1 * _arrow.height,
				top: _inverted ? -1 * _arrow.height : UNDEFINED,
				width: _arrow.width,
				height: _arrow.height,
				left: "50%"
			});
			
			if (_inverted) {
				utils.transform(_internalSelector("jwarrow"), "rotate(180deg)");
			}

			_css(_internalSelector(), {
				padding: _borderSizes.top + "px " + _borderSizes.right + "px " + _borderSizes.bottom + "px " + _borderSizes.left + "px"  
			});
			
			this.showing = false;
		}
		
		function _internalSelector(name) {
			return '#' + _id + (name ? " ." + name : "");
		}
		
		function _createElement(className, parent) {
			var elem = DOCUMENT.createElement("div");
			if (className) elem.className = className;
			if (parent) parent.appendChild(elem);
			return elem;
		}


		function _createSkinElement(name, className) {
			var skinElem = _getSkinElement(name),
				elem = _createElement(className, _container);
			
			_css(_internalSelector(className.replace(" ", ".")), {
				'background-image': skinElem.src
			});
			
			return [elem, skinElem];
			
		}
		
		function _createBorderElement(dim1, dim2) {
			if (!dim2) dim2 = "";
			var created = _createSkinElement('cap' + dim1 + dim2, "jwborder jw" + dim1 + (dim2 ? dim2 : "")); 
				elem = created[0],
				skinElem = created[1],
				elemStyle = {
					'background-image': skinElem.src,
					width: (dim1 == LEFT || dim2 == LEFT || dim1 == RIGHT || dim2 == RIGHT) ? skinElem.width: UNDEFINED,
					height: (dim1 == TOP || dim2 == TOP || dim1 == BOTTOM || dim2 == BOTTOM) ? skinElem.height: UNDEFINED
				};
			
			elemStyle[dim1] = 0;
			if (dim2) elemStyle[dim2] = 0;
			
			_css(_internalSelector(elem.className.replace(/ /g, ".")), elemStyle);
			
			var dim1style = {}, dim2style = {}, dims = { left: skinElem.width, right: skinElem.width, top: skinElem.height, bottom: skinElem.height};
			if (dim1 && dim2) {
				dim1style[dim2] = dims[dim2];
				dim1style[dim1] = 0;
				dim2style[dim1] = dims[dim1];
				dim2style[dim2] = 0;
				_css(_internalSelector("jw"+dim1), dim1style);
				_css(_internalSelector("jw"+dim2), dim2style);
				_borderSizes[dim1] = dims[dim1];
				_borderSizes[dim2] = dims[dim2];
			}
		}

		this.element = function() {
			return _container;
		};
		
		this.setContents = function(contents) {
			utils.empty(_contents);
			_contents.appendChild(contents);
			setTimeout(_position, 0);
		}
		
		this.offsetX = function(offset) {
			_offset = offset;
			_position();
		}
		
		function _position() {
			_css(_internalSelector(), {
				'margin-left': _offset - _container.clientWidth / 2
			});
			_css(_internalSelector("jwarrow"), {
				'margin-left': (_arrow.width / -2) - _offset
			});
		}
		
		this.borderWidth = function() {
			return _borderSizes.left
		}

		function _getSkinElement(name) {
			var elem = _skin.getSkinElement('tooltip', name); 
			if (elem) {
				return elem;
			} else {
				return {
					width: 0,
					height: 0,
					src: "",
					image: UNDEFINED,
					ready: false
				}
			}
		}
		
		this.show = function() {
			this.showing = true;
			_css(_internalSelector(), { opacity: 1, visibility: "visible" });
		}
		
		this.hide = function() {
			this.showing = false;
			_css(_internalSelector(), { opacity: 0, visibility: JW_CSS_HIDDEN });
		}
		
		// Call constructor
		_init();

	}

	/*************************************************************
	 * Player stylesheets - done once on script initialization;  *
	 * These CSS rules are used for all JW Player instances      *
	 *************************************************************/

	_css(OVERLAY_CLASS, {
		position: JW_CSS_ABSOLUTE,
		visibility: JW_CSS_HIDDEN,
		opacity: 0,
//		'z-index': 1 // required for IE9
	});

	_css(OVERLAY_CLASS + " .jwcontents", {
		position: JW_CSS_RELATIVE,
		'z-index': 1
	});

	_css(OVERLAY_CLASS + " .jwborder", {
		position: JW_CSS_ABSOLUTE,
		'background-size': JW_CSS_100PCT + " " + JW_CSS_100PCT
	});

	_css(OVERLAY_CLASS + " .jwback", {
		position: JW_CSS_ABSOLUTE,
		'background-size': JW_CSS_100PCT + " " + JW_CSS_100PCT
	});

	_setTransition(OVERLAY_CLASS, JW_CSS_SMOOTH_EASE);
})(jwplayer);/**
 * Main HTML5 player class
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	html5.player = function(config) {
		var _api = this, 
			_model, 
			_view, 
			_controller,
			_instreamPlayer;

		function _init() {
			_model = new html5.model(config); 
			_api.id = _model.id;
			_view = new html5.view(_api, _model); 
			_controller = new html5.controller(_model, _view);
			
			_initializeAPI();
			
			var setup = new html5.setup(_model, _view, _controller);
			setup.addEventListener(jwplayer.events.JWPLAYER_READY, _readyHandler);
			setup.addEventListener(jwplayer.events.JWPLAYER_ERROR, _errorHandler);
			setup.start();
		}
		
		function _readyHandler(evt) {
			_controller.playerReady(evt);
		}

		function _errorHandler(evt) {
			jwplayer.utils.log('There was a problem setting up the player: ', evt);
		}
		
		function _initializeAPI() {
			
			/** Methods **/
			_api.jwPlay = _controller.play;
			_api.jwPause = _controller.pause;
			_api.jwStop = _controller.stop;
			_api.jwSeek = _controller.seek;
			_api.jwSetVolume = _controller.setVolume;
			_api.jwSetMute = _controller.setMute;
			_api.jwLoad = _controller.load;
			_api.jwPlaylistNext = _controller.next;
			_api.jwPlaylistPrev = _controller.prev;
			_api.jwPlaylistItem = _controller.item;
			_api.jwSetFullscreen = _controller.setFullscreen;
			_api.jwResize = _view.resize;		
			_api.jwSeekDrag = _model.seekDrag;
			_api.jwSetStretching = _controller.setStretching;
			_api.jwGetQualityLevels = _controller.getQualityLevels;
			_api.jwGetCurrentQuality = _controller.getCurrentQuality;
			_api.jwSetCurrentQuality = _controller.setCurrentQuality;
			

			_api.jwGetPlaylistIndex = _statevarFactory('item');
			_api.jwGetPosition = _statevarFactory('position');
			_api.jwGetDuration = _statevarFactory('duration');
			_api.jwGetBuffer = _statevarFactory('buffer');
			_api.jwGetWidth = _statevarFactory('width');
			_api.jwGetHeight = _statevarFactory('height');
			_api.jwGetFullscreen = _statevarFactory('fullscreen');
			_api.jwGetVolume = _statevarFactory('volume');
			_api.jwGetMute = _statevarFactory('mute');
			_api.jwGetState = _statevarFactory('state');
			_api.jwGetStretching = _statevarFactory('stretching');
			_api.jwGetPlaylist = _statevarFactory('playlist');

			/** InStream API **/
			_api.jwDetachMedia = _controller.detachMedia;
			_api.jwAttachMedia = _controller.attachMedia;
			
			_api.jwLoadInstream = function(item, options) {
				if (!_instreamPlayer) {
					_instreamPlayer = new html5.instream(_api, _model, _view, _controller);
				}
				setTimeout(function() {
					_instreamPlayer.load(item, options);
				}, 10);
			}
			
			_api.jwInstreamDestroy = function() {
				if (_instreamPlayer) {
					_instreamPlayer.jwInstreamDestroy();
				}
			}
			
			/** Events **/
			_api.jwAddEventListener = _controller.addEventListener;
			_api.jwRemoveEventListener = _controller.removeEventListener;
			
			/** Dock **/
			_api.jwDockAddButton = _view.addButton;
			_api.jwDockRemoveButton = _view.removeButton;
						
		}

		/** Getters **/
		
		function _statevarFactory(statevar) {
			return function() {
				return _model[statevar];
			};
		}
		


		_init();
	}
})(jwplayer.html5);

/**
 * jwplayer Playlist component for the JW Player.
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var _defaults = {
		size: 180,
		//position: html5.view.positions.NONE,
		itemheight: 60,
		thumbs: true,
		
		fontcolor: "#000000",
		overcolor: "",
		activecolor: "",
		backgroundcolor: "#f8f8f8",
		fontweight: "normal"
	},

	events = jwplayer.events,
	utils = jwplayer.utils, 
	_css = utils.css,
	
	PL_CLASS = '.jwplaylist',
	DOCUMENT = document,
	
	/** Some CSS constants we should use for minimization **/
	JW_CSS_ABSOLUTE = "absolute",
	JW_CSS_RELATIVE = "relative",
	JW_CSS_HIDDEN = "hidden",
	JW_CSS_100PCT = "100%";
	
	html5.playlistcomponent = function(api, config) {
		var _api = api,
			_skin = _api.skin,
			_settings = utils.extend({}, _defaults, _api.skin.getComponentSettings("playlist"), config),
			_wrapper,
			_container,
			_playlist,
			_items,
			_ul,
			_lastCurrent = -1,
			_clickedIndex,
			_slider,
			_elements = {
				'background': undefined,
				'item': undefined,
				'itemOver': undefined,
				'itemImage': undefined,
				'itemActive': undefined
			};

		this.element = function() {
			return _wrapper;
		};
		
		this.redraw = function() {
			if (_slider) _slider.redraw();
		};
		
		this.show = function() {
			_show(_wrapper);
		}

		this.hide = function() {
			_hide(_wrapper);
		}


		function _setup() {
			_wrapper = _createElement("div", "jwplaylist"); 
			_wrapper.id = _api.id + "_jwplayer_playlistcomponent";
			
			_container = _createElement("div", "jwlistcontainer");
			_appendChild(_wrapper, _container);
			
			_populateSkinElements();
			if (_elements.item) {
				_settings.itemheight = _elements.item.height;
			}
			
			_setupStyles();
			
			_api.jwAddEventListener(events.JWPLAYER_PLAYLIST_LOADED, _rebuildPlaylist);
			_api.jwAddEventListener(events.JWPLAYER_PLAYLIST_ITEM, _itemHandler);
		}
		
		function _internalSelector(className) {
			return '#' + _wrapper.id + (className ? ' .' + className : "");
		}
		
		function _setupStyles() {
			var imgPos = 0, imgWidth = 0, imgHeight = 0, 
				itemheight = _settings.itemheight;

			utils.clearCss(_internalSelector());

			_css(_internalSelector(), {
				'background-color':	_settings.backgroundcolor 
			});
			
			_css(_internalSelector("jwlist"), {
				'background-image': _elements.background ? " url("+_elements.background.src+")" : "",
		    	color: _settings.fontcolor,
		    	font: _settings.fontweight + " 11px Arial, Helvetica, sans-serif"  
			});
			
        	if (_elements.itemImage) {
        		imgPos = (itemheight - _elements.itemImage.height) / 2;
        		imgWidth = _elements.itemImage.width;
        		imgHeight = _elements.itemImage.height;
        	} else {
        		imgWidth = itemheight * 4 / 3;
        		imgHeight = itemheight
        	}
			
        	_css(_internalSelector("jwplaylistimg"), {
			    height: imgHeight,
			    width: imgWidth,
				margin: imgPos
        	});
			
			_css(_internalSelector("jwlist li"), {
				'background-image': _elements.item ? "url("+_elements.item.src+")" : "",
				height: itemheight,
				'background-size': JW_CSS_100PCT + " " + itemheight + "px",
		    	cursor: 'pointer'
			});

			var activeStyle = { overflow: 'hidden' };
			if (_settings.activecolor !== "") activeStyle.color = _settings.activecolor;
			if (_elements.itemActive) activeStyle['background-image'] = "url("+_elements.itemActive.src+")";
			_css(_internalSelector("jwlist li.active"), activeStyle);

			var overStyle = { overflow: 'hidden' };
			if (_settings.overcolor !== "") overStyle.color = _settings.overcolor;
			if (_elements.itemOver) overStyle['background-image'] = "url("+_elements.itemOver.src+")";
			_css(_internalSelector("jwlist li:hover"), overStyle);


			_css(_internalSelector("jwtextwrapper"), {
				padding: "5px 5px 0 " + (imgPos ? 0 : "5px"),
				height: itemheight - 5,
				position: JW_CSS_RELATIVE
			});
			
			_css(_internalSelector("jwtitle"), {
	    		height: 23,
	        	overflow: 'hidden',
	        	display: "inline-block",
	        	width: JW_CSS_100PCT,
	        	'line-height': 23,
		    	'font-size': 13,
	        	'font-weight': _settings.fontweight ? _settings.fontweight : "bold"
	    	});
			
			_css(_internalSelector("jwdescription"), {
	    	    display: 'block',
	    	    'font-size': 11,
	    	    'line-height': 16,
	        	overflow: 'hidden',
	        	height: itemheight,
	        	position: JW_CSS_RELATIVE
	    	});

			_css(_internalSelector("jwduration"), {
				position: "absolute",
	    	    'font-size': 11,
				right: 5
			});
			
		}

		function _createList() {
			var ul = _createElement("ul", "jwlist");
			ul.id = _wrapper.id + "_ul" + Math.round(Math.random()*10000000);
			return ul;
		}


		function _createItem(index) {
			var item = _playlist[index],
				li = _createElement("li", "jwitem");
			
			li.id = _ul.id + '_item_' + index;
			
			var imageWrapper = _createElement("div", "jwplaylistimg jwfill");
        	
			if (_showThumbs() && (item.image || item['playlist.image'] || _elements.itemImage) ) {
				var imageSrc; 
				if (item['playlist.image']) {
					imageSrc = item['playlist.image'];	
				} else if (item.image) {
					imageSrc = item.image;
				} else if (_elements.itemImage) {
					imageSrc = _elements.itemImage.src;
				}
	        	
	        	_css('#'+li.id+' .jwplaylistimg', {
					'background-image': imageSrc ? 'url('+imageSrc+')': null
	        	});
	        	
				_appendChild(li, imageWrapper);
	        }
			
			var textWrapper = _createElement("div", "jwtextwrapper");
        	var title = _createElement("span", "jwtitle");
        	title.innerHTML = item ? item.title : "";
        	_appendChild(textWrapper, title);

	        if (item.description) {
	        	var desc = _createElement("span", "jwdescription");
	        	desc.innerHTML = item.description;
	        	_appendChild(textWrapper, desc);
	        }
	        
	        if (item.duration > 0) {
	        	var dur = _createElement("span", "jwduration");
	        	dur.innerHTML = utils.timeFormat(item.duration);
	        	_appendChild(title, dur);
	        }
	        
	        _appendChild(li, textWrapper);
			return li;
		}
		
		function _createElement(type, className) {
			var elem = DOCUMENT.createElement(type);
			if (className) elem.className = className;
			return elem;
		}
		
		function _appendChild(parent, child) {
			parent.appendChild(child);
		}
			
		function _rebuildPlaylist(evt) {
			_container.innerHTML = "";
			
			_playlist = _getPlaylist();
			if (!_playlist) {
				return;
			}
			items = [];
			_ul = _createList();
			
			for (var i=0; i<_playlist.length; i++) {
				var li = _createItem(i);
				li.onclick = _clickHandler(i);
				_appendChild(_ul, li);
				items.push(li);
			}
			
			_lastCurrent = _api.jwGetPlaylistIndex();
			
			if (utils.isIOS() && window.iScroll) {
				_wrapper.innerHTML = "";
				_appendChild(_wrapper, _ul);
				_ul.style.height = _settings.itemheight * _playlist.length + "px";
				var myscroll = new iScroll(_wrapper.id);
			} else {
				_appendChild(_container, _ul);
				_slider = new html5.playlistslider(_wrapper.id + "_slider", _api.skin, _wrapper, _ul);
			}
			
		}
		
		function _getPlaylist() {
			var list = _api.jwGetPlaylist();
			var strippedList = [];
			for (var i=0; i<list.length; i++) {
				if (!list[i]['ova.hidden']) {
					strippedList.push(list[i]);
				}
			}
			return strippedList;
		}
		
		function _clickHandler(index) {
			return function() {
				_clickedIndex = index;
				_api.jwPlaylistItem(index);
				_api.jwPlay(true);
			}
		}
		
		function _scrollToItem() {
			var idx = _api.jwGetPlaylistIndex();
			// No need to scroll if the user clicked the current item
			if (idx == _clickedIndex) return;
			_clickedIndex = -1;
				
			if (utils.isIOS() && window.iScroll) {
				_ul.scrollTop = idx * _settings.itemheight;
			} else if (_slider) {
				_slider.thumbPosition(idx / (_api.jwGetPlaylist().length-1)) ;
			}
		}

		function _showThumbs() {
			return _settings.thumbs.toString().toLowerCase() == "true";	
		}

		function _itemHandler(evt) {
			if (_lastCurrent >= 0) {
				DOCUMENT.getElementById(_ul.id + '_item_' + _lastCurrent).className = "jwitem";
				_lastCurrent = evt.index;
			}
			DOCUMENT.getElementById(_ul.id + '_item_' + evt.index).className = "jwitem active";
			_scrollToItem();
		}

		
		function _populateSkinElements() {
			for (var i in _elements) {
				_elements[i] = _getElement(i);
			}
		}
		
		function _getElement(name) {
			return _skin.getSkinElement("playlist", name);
		}
		
		_setup();
		return this;
	};
	
	/** Global playlist styles **/

	_css(PL_CLASS, {
		position: JW_CSS_ABSOLUTE,
	    width: JW_CSS_100PCT,
		height: JW_CSS_100PCT
	});
	
	utils.dragStyle(PL_CLASS, 'none');

	_css(PL_CLASS + ' .jwplaylistimg', {
		position: JW_CSS_RELATIVE,
	    width: JW_CSS_100PCT,
	    'float': 'left',
	    margin: '0 5px 0 0',
		background: "#000",
		overflow: JW_CSS_HIDDEN
	});

	_css(PL_CLASS+' .jwlist', {
		position: JW_CSS_ABSOLUTE,
		width: JW_CSS_100PCT,
    	'list-style': 'none',
    	margin: 0,
    	padding: 0
	});
	
	_css(PL_CLASS+' .jwlistcontainer', {
		position: JW_CSS_ABSOLUTE,
		overflow: JW_CSS_HIDDEN,
		width: JW_CSS_100PCT,
		height: JW_CSS_100PCT
	});

	_css(PL_CLASS+' .jwlist li', {
	    width: JW_CSS_100PCT
	});

	_css(PL_CLASS+' .jwtextwrapper', {
		overflow: JW_CSS_HIDDEN
	});
	

})(jwplayer.html5);
/**
 * JW Player playlist loader
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var _jw = jwplayer, utils = _jw.utils, events = _jw.events;

	html5.playlistloader = function() {
		var _eventDispatcher = new events.eventdispatcher();
		utils.extend(this, _eventDispatcher);
		
		this.load = function(playlistfile) {
			utils.ajax(playlistfile, _playlistLoaded, _playlistError)
		}
		
		function _playlistLoaded(loadedEvent) {
			try {
				var rss = loadedEvent.responseXML.firstChild;
				if (html5.parsers.localName(rss) == "xml") {
					rss = rss.nextSibling;
				}
				
				if (html5.parsers.localName(rss) != "rss") {
					_playlistError("Playlist is not a valid RSS feed.");
					return;
				}
				
				var playlist = new _jw.playlist(html5.parsers.rssparser.parse(rss));
				// TODO: full source inspection here - need to detect if there are playable sources in the list
				if (playlist && playlist.length && playlist[0].sources && playlist[0].sources.length && playlist[0].sources[0].file) {
					_eventDispatcher.sendEvent(events.JWPLAYER_PLAYLIST_LOADED, {
						playlist: playlist
					});
				} else {
					_playlistError("No playable sources found");
				}
			} catch (e) {
				_playlistError('Could not load the playlist.');
			}
		}
		
		function _playlistError(msg) {
			_eventDispatcher.sendEvent(events.JWPLAYER_ERROR, {
				message: msg ? msg : 'Could not load playlist an unknown reason.'
			});
		}
	}
})(jwplayer.html5);/**
 * Playlist slider component for the JW Player.
 *
 * @author pablo
 * @version 6.0
 * 
 * TODO: reuse this code for vertical controlbar volume slider
 */
(function(html5) {
	var events = jwplayer.events,
		utils = jwplayer.utils, 
		_css = utils.css,
	
		SLIDER_CLASS = 'jwslider',
		SLIDER_TOPCAP_CLASS = 'jwslidertop',
		SLIDER_BOTTOMCAP_CLASS = 'jwsliderbottom',
		SLIDER_RAIL_CLASS = 'jwrail',
		SLIDER_RAILTOP_CLASS = 'jwrailtop',
		SLIDER_RAILBACK_CLASS = 'jwrailback',
		SLIDER_RAILBOTTOM_CLASS = 'jwrailbottom',
		SLIDER_THUMB_CLASS = 'jwthumb',
		SLIDER_THUMBTOP_CLASS = 'jwthumbtop',
		SLIDER_THUMBBACK_CLASS = 'jwthumbback',
		SLIDER_THUMBBOTTOM_CLASS = 'jwthumbbottom',
	
		DOCUMENT = document,
		UNDEFINED = undefined,
	
		/** Some CSS constants we should use for minimization **/
		JW_CSS_ABSOLUTE = "absolute",
		JW_CSS_100PCT = "100%";
	
	html5.playlistslider = function(id, skin, parent, pane) {
		var _skin = skin,
			_id = id,
			_pane = pane,
			_wrapper,
			_rail,
			_thumb,
			_dragging,
			_thumbPercent = 0, 
			_dragTimeout, 
			_dragInterval,
			_visible = true,
			
			// Skin elements
			_sliderCapTop,
			_sliderCapBottom,
			_sliderRail,
			_sliderRailCapTop,
			_sliderRailCapBottom,
			_sliderThumb,
			_sliderThumbCapTop,
			_sliderThumbCapBottom,
			
			_topHeight,
			_bottomHeight;


		this.element = function() {
			return _wrapper;
		};


		function _setup() {	
			var capTop, capBottom;
			
			_wrapper = _createElement(SLIDER_CLASS, null, parent);
			_wrapper.id = id;
			
			_wrapper.addEventListener('mousedown', _startDrag, false);
			_wrapper.addEventListener('click', _moveThumb, false);
			window.addEventListener('mousemove', _moveThumb, false);
			window.addEventListener('mouseup', _endDrag, false);
			
			_populateSkinElements();
			
			_topHeight = _sliderCapTop.height;
			_bottomHeight = _sliderCapBottom.height;
			
			_css(_internalSelector(), { width: _sliderRail.width });
			_css(_internalSelector(SLIDER_RAIL_CLASS), { top: _topHeight, bottom: _bottomHeight });
			_css(_internalSelector(SLIDER_THUMB_CLASS), { top: _topHeight });
			
			capTop = _createElement(SLIDER_TOPCAP_CLASS, _sliderCapTop, _wrapper);
			capBottom = _createElement(SLIDER_BOTTOMCAP_CLASS, _sliderCapBottom, _wrapper);
			_rail = _createElement(SLIDER_RAIL_CLASS, null, _wrapper);
			_thumb = _createElement(SLIDER_THUMB_CLASS, null, _wrapper);
			
			capTop.addEventListener('mousedown', _scroll(-1), false);
			capBottom.addEventListener('mousedown', _scroll(1), false);
			
			_createElement(SLIDER_RAILTOP_CLASS, _sliderRailCapTop, _rail);
			_createElement(SLIDER_RAILBACK_CLASS, _sliderRail, _rail, true);
			_createElement(SLIDER_RAILBOTTOM_CLASS, _sliderRailCapBottom, _rail);
			_css(_internalSelector(SLIDER_RAILBACK_CLASS), {
				top: _sliderRailCapTop.height,
				bottom: _sliderRailCapBottom.height
			});
			
			_createElement(SLIDER_THUMBTOP_CLASS, _sliderThumbCapTop, _thumb);
			_createElement(SLIDER_THUMBBACK_CLASS, _sliderThumb, _thumb, true);
			_createElement(SLIDER_THUMBBOTTOM_CLASS, _sliderThumbCapBottom, _thumb);
			
			_css(_internalSelector(SLIDER_THUMBBACK_CLASS), {
				top: _sliderThumbCapTop.height,
				bottom: _sliderThumbCapBottom.height
			});
			
			_redraw();
			
			if (_pane) {
				_pane.addEventListener("mousewheel", _scrollHandler, false);
				_pane.addEventListener("DOMMouseScroll", _scrollHandler, false);
			}
		}
		
		function _internalSelector(className) {
			return '#' + _wrapper.id + (className ? " ." + className : "");
		}
		
		function _createElement(className, skinElement, parent, stretch) {
			var elem = DOCUMENT.createElement("div");
			if (className) {
				elem.className = className;
				if (skinElement) {
					_css(_internalSelector(className), { 
						'background-image': skinElement.src ? skinElement.src : UNDEFINED, 
						'background-repeat': stretch ? "repeat-y" : "no-repeat",
						height: stretch ? UNDEFINED : skinElement.height
					});
				}
			}
			if (parent) parent.appendChild(elem);
			return elem;
		}
		
		function _populateSkinElements() {
			_sliderCapTop = _getElement('sliderCapTop');
			_sliderCapBottom = _getElement('sliderCapBottom');
			_sliderRail = _getElement('sliderRail');
			_sliderRailCapTop = _getElement('sliderRailCapTop');
			_sliderRailCapBottom = _getElement('sliderRailCapBottom');
			_sliderThumb = _getElement('sliderThumb');
			_sliderThumbCapTop = _getElement('sliderThumbCapTop');
			_sliderThumbCapBottom = _getElement('sliderThumbCapBottom');
		}
		
		function _getElement(name) {
			var elem = _skin.getSkinElement("playlist", name);
			return elem ? elem : { width: 0, height: 0, src: UNDEFINED };
		}
		
		var _redraw = this.redraw = function() {
			if (_pane && _pane.clientHeight) {
				_setThumbPercent(_pane.parentNode.clientHeight / _pane.clientHeight);
			}
		}
		

		function _scrollHandler(evt) {
			if (!_visible) return;
			evt = evt ? evt : window.event;
			var wheelData = evt.detail ? evt.detail * -1 : evt.wheelDelta / 40;
			_setThumbPosition(_thumbPercent - wheelData / 10);
			  
			// Cancel event so the page doesn't scroll
			if(evt.stopPropagation) evt.stopPropagation();
			if(evt.preventDefault) evt.preventDefault();
			evt.cancelBubble = true;
			evt.cancel = true;
			evt.returnValue = false;
			return false;
		};
	
		var _setThumbPercent = this.thumbPercent = function(pct) {
			if (pct < 0) pct = 0;
			if (pct > 1) {
				_visible = false;
			} else {
				_visible = true;
				_css(_internalSelector(SLIDER_THUMB_CLASS), { height: Math.max(_rail.clientHeight * pct , _sliderThumbCapTop.height + _sliderThumbCapBottom.height) });
			}
			_css(_internalSelector(), { visibility: _visible ? "visible" : "hidden" });
			if (_pane) {
				_pane.style.width = _visible ? _pane.parentElement.clientWidth - _sliderRail.width + "px" : "";
			}
		}

		var _setThumbPosition = this.thumbPosition = function(pct) {
			if (isNaN(pct)) pct = 0;
			_thumbPercent = Math.max(0, Math.min(1, pct));
			_css(_internalSelector(SLIDER_THUMB_CLASS), {
				top: _topHeight + (_rail.clientHeight - _thumb.clientHeight) * _thumbPercent
			});
			if (pane) {
				pane.style.top = (_wrapper.clientHeight - pane.scrollHeight) * _thumbPercent + "px";
			}
		}


		function _startDrag(evt) {
			if (evt.button == 0) _dragging = true;
		}
		
		function _moveThumb(evt) {
			if (_dragging || evt.type == "click") {
				var railRect = utils.bounds(_rail),
					rangeTop = _thumb.clientHeight / 2,
					rangeBottom = railRect.height - rangeTop,
					y = evt.clientY - railRect.top,
					pct = (y - rangeTop) / (rangeBottom - rangeTop);
				_setThumbPosition(pct);
			}
		}
		
		function _scroll(dir) {
			return function(evt) {
				if (evt.button > 0) return;
				_setThumbPosition(_thumbPercent+(dir*.05));
				_dragTimeout = setTimeout(function() {
					_dragInterval = setInterval(function() {
						_setThumbPosition(_thumbPercent+(dir*.05));
					}, 50);
				}, 500);
			}
		}
		
		function _endDrag() {
			_dragging = false;
			clearTimeout(_dragTimeout);
			clearInterval(_dragInterval);
		}
		
		_setup();
		return this;
	};
	
	function _globalSelector() {
		var selector=[],i;
		for (i=0; i<arguments.length; i++) {
			selector.push(".jwplaylist ."+arguments[i]);
		}
		return selector.join(',');
	}
	
	/** Global slider styles **/

	_css(_globalSelector(SLIDER_CLASS), {
		position: JW_CSS_ABSOLUTE,
		height: JW_CSS_100PCT,
		right: 0,
		top: 0,
		cursor: "pointer",
		'z-index': 1
	});
	
	_css(_globalSelector(SLIDER_CLASS) + ' *', {
		position: JW_CSS_ABSOLUTE,
	    width: JW_CSS_100PCT,
	    'background-position': "center",
	});

	_css(_globalSelector(SLIDER_TOPCAP_CLASS, SLIDER_RAILTOP_CLASS, SLIDER_THUMBTOP_CLASS), { top: 0 });
	_css(_globalSelector(SLIDER_BOTTOMCAP_CLASS, SLIDER_RAILBOTTOM_CLASS, SLIDER_THUMBBOTTOM_CLASS), { bottom: 0 });

})(jwplayer.html5);
/**
 * This class is responsible for setting up the player and triggering the PLAYER_READY event, or an JWPLAYER_ERROR event
 * 
 * The order of the player setup is as follows:
 * 
 * 1. parse config
 * 2. load skin (async)
 * 3. load external playlist (async)
 * 4. load preview image (requires 3)
 * 5. initialize components (requires 2)
 * 6. initialize plugins (requires 5)
 * 7. ready
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var _jw = jwplayer, utils = _jw.utils, events = _jw.events, playlist = _jw.playlist,
	
		PARSE_CONFIG = 1,
		LOAD_SKIN = 2,
		LOAD_PLAYLIST = 3,
		LOAD_PREVIEW = 4,
		SETUP_COMPONENTS = 5,
		INIT_PLUGINS = 6,
		SEND_READY = 7;

	html5.setup = function(model, view, controller) {
		var _model = model, 
			_view = view,
			_controller = controller,
			_completed = {},
			_depends = {},
			_skin,
			_eventDispatcher = new events.eventdispatcher(),
			_errorState = false,
			_queue = [];
			
		function _initQueue() {
			_addTask(PARSE_CONFIG, _parseConfig);
			_addTask(LOAD_SKIN, _loadSkin, PARSE_CONFIG);
			_addTask(LOAD_PLAYLIST, _loadPlaylist, PARSE_CONFIG);
			_addTask(LOAD_PREVIEW, _loadPreview, LOAD_PLAYLIST);
			_addTask(SETUP_COMPONENTS, _setupComponents, LOAD_PREVIEW + "," + LOAD_SKIN);
			_addTask(INIT_PLUGINS, _initPlugins, SETUP_COMPONENTS + "," + LOAD_PLAYLIST);
			_addTask(SEND_READY, _sendReady, INIT_PLUGINS);
		}
		
		function _addTask(name, method, depends) {
			_queue.push({name:name, method:method, depends:depends});
		}

		function _nextTask() {
			for (var i=0; i < _queue.length; i++) {
				var task = _queue[i];
				if (_allComplete(task.depends)) {
					_queue.splice(i, 1);
					try {
						task.method();
						_nextTask();
					} catch(error) {
						_error(error.message);
					}
					return;
				}
			}
			if (_queue.length > 0 && !_errorState) {
				// Still waiting for a dependency to come through; wait a little while.
				setTimeout(_nextTask, 500);
			}
		}
		
		function _allComplete(dependencies) {
			if (!dependencies) return true;
			var split = dependencies.toString().split(",");
			for (var i=0; i<split.length; i++) {
				if (!_completed[split[i]])
					return false;
			}
			return true;
		}

		function _taskComplete(name) {
			_completed[name] = true;
		}
		
		function _parseConfig() {
			_taskComplete(PARSE_CONFIG);
		}
		
		function _loadSkin() {
			_skin = new html5.skin();
			_skin.load(_model.config.skin, _skinLoaded, _skinError);
		}
		
		function _skinLoaded(skin) {
			_taskComplete(LOAD_SKIN);
		}

		function _skinError(message) {
			_error("Error loading skin: " + message);
		}

		function _loadPlaylist() {
			switch(utils.typeOf(_model.config.playlist)) {
			case "string":
				var loader = new html5.playlistloader();
				loader.addEventListener(events.JWPLAYER_PLAYLIST_LOADED, _playlistLoaded);
				loader.addEventListener(events.JWPLAYER_ERROR, _playlistError);
				loader.load(_model.config.playlist);
				break;
			case "array":
				_completePlaylist(new playlist(_model.config.playlist));
			}
		}
		
		function _playlistLoaded(evt) {
			_completePlaylist(evt.playlist);
		}
		
		function _completePlaylist(playlist) {
			_model.setPlaylist(playlist);
			if (_model.playlist[0].sources.length == 0) {
				_error("Error loading playlist: No playable sources found");
			} else {
				_taskComplete(LOAD_PLAYLIST);
			}
		}

		function _playlistError(evt) {
			_error("Error loading playlist: " + evt.message);
		}
		
		function _loadPreview() {
			var preview = _model.playlist[_model.item].image; 
			if (preview) {
				var img = new Image();
				img.addEventListener('load', _previewLoaded, false);
				// If there was an error, continue anyway
				img.addEventListener('error', _previewLoaded, false);
				img.src = preview;
				setTimeout(_previewLoaded, 500);
			} else {
				_taskComplete(LOAD_PREVIEW);	
			}
		}
		
		function _previewLoaded() {
			_taskComplete(LOAD_PREVIEW);
		}

		function _setupComponents() {
			_view.setup(_skin);
			_taskComplete(SETUP_COMPONENTS);
		}
		
		function _initPlugins() {
			_taskComplete(INIT_PLUGINS);
		}

		function _sendReady() {
			_eventDispatcher.sendEvent(events.JWPLAYER_READY);
			_taskComplete(SEND_READY);
		}
		
		function _error(message) {
			_errorState = true;
			_eventDispatcher.sendEvent(events.JWPLAYER_ERROR, {message: message});
			_view.setupError(message);
		}
		
		utils.extend(this, _eventDispatcher);
		
		this.start = _nextTask;
		
		_initQueue();
	}

})(jwplayer.html5);

/**
 * JW Player component that loads PNG skins.
 *
 * @author zach
 * @version 5.4
 */
(function(html5) {
	html5.skin = function() {
		var _components = {};
		var _loaded = false;
		
		this.load = function(path, completeCallback, errorCallback) {
			new html5.skinloader(path, function(skin) {
				_loaded = true;
				_components = skin;
				if (typeof completeCallback == "function") completeCallback();
			}, function(message) {
				if (typeof errorCallback == "function") errorCallback(message);
			});
			
		};
		
		this.getSkinElement = function(component, element) {
			component = _lowerCase(component);
			element = _lowerCase(element);
			if (_loaded) {
				try {
					return _components[component].elements[element];
				} catch (err) {
					jwplayer.utils.log("No such skin component / element: ", [component, element]);
				}
			}
			return null;
		};
		
		this.getComponentSettings = function(component) {
			component = _lowerCase(component);
			if (_loaded && _components && _components[component]) {
				return _components[component].settings;
			}
			return null;
		};
		
		this.getComponentLayout = function(component) {
			component = _lowerCase(component);
			if (_loaded) {
				var lo = _components[component].layout;
				if (lo && (lo.left || lo.right || lo.center))
					return _components[component].layout;
			}
			return null;
		};
		
		function _lowerCase(string) {
			return string.toLowerCase();
		}
		
	};
})(jwplayer.html5);
/**
 * JW Player component that loads PNG skins.
 *
 * @author zach
 * @modified pablo
 * @version 6.0
 */
(function(html5) {
	var _utils = jwplayer.utils;
	
	/** Constructor **/
	html5.skinloader = function(skinPath, completeHandler, errorHandler) {
		var _skin = {},
			_completeHandler = completeHandler,
			_errorHandler = errorHandler,
			_loading = true,
			_completeInterval,
			_skinPath = skinPath,
			_error = false,
			_defaultSkin;
		
		/** Load the skin **/
		function _load() {
			if (typeof _skinPath != "string" || _skinPath === "") {
				_loadSkin(html5.defaultskin().xml);
			} else {
				if (_utils.extension(_skinPath) != "xml") {
					_errorHandler("Skin not a valid file type");
					return;
				}
				// Load the default skin first; if any components are defined in the loaded skin, they will overwrite the default
				var defaultLoader = new html5.skinloader("", _defaultLoaded, errorHandler);
			}
			
		}
		
		
		function _defaultLoaded(defaultSkin) {
			_skin = defaultSkin;
			_utils.ajax(_utils.getAbsolutePath(_skinPath), function(xmlrequest) {
				try {
					if (_utils.exists(xmlrequest.responseXML)){
						_loadSkin(xmlrequest.responseXML);
						return;	
					}
				} catch (err){
					_clearSkin();
				}
			}, function(message) {
				_errorHandler(message);
			});
		}
		
		function _loadSkin(xml) {
			var components = xml.getElementsByTagName('component');
			if (components.length === 0) {
				errorHandler("Skin formatting error")
			}
			for (var componentIndex = 0; componentIndex < components.length; componentIndex++) {
				var componentName = _lowerCase(components[componentIndex].getAttribute("name"));
				var component = {
					settings: {},
					elements: {},
					layout: {}
				};
				_skin[componentName] = component;
				var elements = components[componentIndex].getElementsByTagName('elements')[0].getElementsByTagName('element');
				for (var elementIndex = 0; elementIndex < elements.length; elementIndex++) {
					_loadImage(elements[elementIndex], componentName);
				}
				var settingsElement = components[componentIndex].getElementsByTagName('settings')[0];
				if (settingsElement && settingsElement.childNodes.length > 0) {
					var settings = settingsElement.getElementsByTagName('setting');
					for (var settingIndex = 0; settingIndex < settings.length; settingIndex++) {
						var name = settings[settingIndex].getAttribute("name");
						var value = settings[settingIndex].getAttribute("value");
						if(/color$/.test(name)) { value = _utils.stringToColor(value); }
						component.settings[_lowerCase(name)] = value;
					}
				}
				var layout = components[componentIndex].getElementsByTagName('layout')[0];
				if (layout && layout.childNodes.length > 0) {
					var groups = layout.getElementsByTagName('group');
					for (var groupIndex = 0; groupIndex < groups.length; groupIndex++) {
						var group = groups[groupIndex],
							_layout = {
								elements: []
							};
						component.layout[_lowerCase(group.getAttribute("position"))] = _layout;
						for (var attributeIndex = 0; attributeIndex < group.attributes.length; attributeIndex++) {
							var attribute = group.attributes[attributeIndex];
							_layout[attribute.name] = attribute.value;
						}
						var groupElements = group.getElementsByTagName('*');
						for (var groupElementIndex = 0; groupElementIndex < groupElements.length; groupElementIndex++) {
							var element = groupElements[groupElementIndex];
							_layout.elements.push({
								type: element.tagName
							});
							for (var elementAttributeIndex = 0; elementAttributeIndex < element.attributes.length; elementAttributeIndex++) {
								var elementAttribute = element.attributes[elementAttributeIndex];
								_layout.elements[groupElementIndex][_lowerCase(elementAttribute.name)] = elementAttribute.value;
							}
							if (!_utils.exists(_layout.elements[groupElementIndex].name)) {
								_layout.elements[groupElementIndex].name = element.tagName;
							}
						}
					}
				}
				
				_loading = false;
				
				_resetCompleteIntervalTest();
			}
		}
		
		
		function _resetCompleteIntervalTest() {
			clearInterval(_completeInterval);
			if (!_error) {
				_completeInterval = setInterval(function() {
					_checkComplete();
				}, 100);
			}
		}
		
		
		/** Load the data for a single element. **/
		function _loadImage(element, component) {
			component = _lowerCase(component);
			var img = new Image(),
				elementName = _lowerCase(element.getAttribute("name")),
				elementSource = element.getAttribute("src"),
				imgUrl;
			
			if (elementSource.indexOf('data:image/png;base64,') === 0) {
				imgUrl = elementSource;
			} else {
				var skinUrl = _utils.getAbsolutePath(_skinPath);
				var skinRoot = skinUrl.substr(0, skinUrl.lastIndexOf('/'));
				imgUrl = [skinRoot, component, elementSource].join('/');
			}
			
			_skin[component].elements[elementName] = {
				height: 0,
				width: 0,
				src: '',
				ready: false,
				image: img
			};
			
			img.onload = function(evt) {
				_completeImageLoad(img, elementName, component);
			};
			img.onerror = function(evt) {
				_error = true;
				_resetCompleteIntervalTest();
				_errorHandler("Skin image not found: " + this.src);
			};
			
			img.src = imgUrl;
		}
		
		function _clearSkin() {
			for (var componentName in _skin) {
				var component = _skin[componentName];
				for (var elementName in component.elements) {
					var element = component.elements[elementName];
					var img = element.image;
					img.onload = null;
					img.onerror = null;
					delete element.image;
					delete component.elements[elementName];
				}
				delete _skin[componentName];
			}
		}
		
		function _checkComplete() {
			for (var component in _skin) {
				if (component != 'properties') {
					for (var element in _skin[component].elements) {
						if (!_getElement(component, element).ready) {
							return;
						}
					}
				}
			}
			if (_loading === false) {
				clearInterval(_completeInterval);
				_completeHandler(_skin);
			}
		}
		
		function _completeImageLoad(img, element, component) {
			var elementObj = _getElement(component, element);
			if(elementObj) {
				elementObj.height = img.height;
				elementObj.width = img.width;
				elementObj.src = img.src;
				elementObj.ready = true;
				_resetCompleteIntervalTest();
			} else {
				_utils.log("Loaded an image for a missing element: " + component + "." + element);
			}
		}
		

		function _getElement(component, element) {
			return _skin[_lowerCase(component)] ? _skin[_lowerCase(component)].elements[_lowerCase(element)] : null;
		}
		
		function _lowerCase(string) {
			return string ? string.toLowerCase() : '';
		}
		_load();
	};
})(jwplayer.html5);
/**
 * Video tag stuff
 * 
 * @author pablo
 * @version 6.0
 */
(function(jwplayer) {

	var utils = jwplayer.utils, 
		events = jwplayer.events, 
		states = events.state;
	

	/** HTML5 video class * */
	jwplayer.html5.video = function(videotag) {

		var _mediaEvents = {
			"abort" : _generalHandler,
			"canplay" : _canPlayHandler,
			"canplaythrough" : _generalHandler,
			"durationchange" : _durationUpdateHandler,
			"emptied" : _generalHandler,
			"ended" : _generalHandler,
			"error" : _errorHandler,
			"loadeddata" : _generalHandler,
			"loadedmetadata" : _canPlayHandler,
			"loadstart" : _generalHandler,
			"pause" : _playHandler,
			"play" : _playHandler,
			"playing" : _playHandler,
			"progress" : _generalHandler,
			"ratechange" : _generalHandler,
			"readystatechange" : _generalHandler,
			"seeked" : _sendSeekEvent,
			"seeking" : _generalHandler,
			"stalled" : _generalHandler,
			"suspend" : _generalHandler,
			"timeupdate" : _timeUpdateHandler,
			"volumechange" : _volumeHandler,
			"waiting" : _bufferStateHandler
		},
		
		_extensions = utils.extensionmap,

		// Current playlist item
		_item,
		// Currently playing source
		_source,
		// Current type - used to filter the sources
		_type,
		// Reference to the video tag
		_videotag,
		// Current duration
		_duration,
		// Current position
		_position,
		// Requested seek position
		_seekOffset,
		// Whether seeking is ready yet
		_canSeek,
		// Whether we have sent out the BUFFER_FULL event
		_bufferFull,
		// If we should seek on canplay
		_delayedSeek,
		// If we're currently dragging the seek bar
		_dragging,
		// Current media state
		_state = states.IDLE,
		// Save the volume state before muting
		_lastVolume,
		// Using setInterval to check buffered ranges
		_bufferInterval = -1,
		// Last sent buffer amount
		_bufferPercent = -1,
		// Event dispatcher
		_eventDispatcher = new events.eventdispatcher(),
		// Whether or not we're listening to video tag events
		_attached = false,
		// Quality levels
		_levels,
		// Current quality level index
		_currentQuality = -1,
		// Reference to self
		_this = this;
		
		utils.extend(_this, _eventDispatcher);

		// Constructor
		function _init(videotag) {
			_videotag = videotag;
			_setupListeners();

			// Workaround for a Safari bug where video disappears on switch to fullscreen
			_videotag.controls = true;
			_videotag.controls = false;
			
			_attached = true;
		}

		function _setupListeners() {
			for (var evt in _mediaEvents) {
				_videotag.addEventListener(evt, _mediaEvents[evt], false);
			}
		}

		function _sendEvent(type, data) {
			if (_attached) {
				_eventDispatcher.sendEvent(type, data);
			}
		}

		
		function _generalHandler(evt) {
			//console.log("%s %o (%s,%s)", evt.type, evt);
		}

		function _durationUpdateHandler(evt) {
			if (!_attached) return;
			if (_duration < 0) _duration = _videotag.duration;
			_timeUpdateHandler();
		}

		function _timeUpdateHandler(evt) {
			if (!_attached) return;
			if (_state == states.PLAYING && !_dragging) {
				_position = _videotag.currentTime;
				_sendEvent(events.JWPLAYER_MEDIA_TIME, {
					position : _position,
					duration : _duration
				});
				if (_position >= _duration && _duration > 0) {
					_complete();
				}
			}
		}

		function _canPlayHandler(evt) {
			if (!_attached) return;
			if (!_canSeek) {
				_canSeek = true;
				_sendBufferFull();
				if (_delayedSeek > 0) {
					_seek(_delayedSeek);
				}
			}
		}
		
		function _sendBufferFull() {
			if (!_bufferFull) {
				_bufferFull = true;
				_sendEvent(events.JWPLAYER_MEDIA_BUFFER_FULL);
			}
		}

		function _playHandler(evt) {
			if (!_attached || _dragging) return;
			
			if (_videotag.paused) {
				_pause();
			} else {
				_setState(states.PLAYING);
			}
		}

		function _bufferStateHandler(evt) {
			if (!_attached) return;
			_setState(states.BUFFERING);
		}

		function _errorHandler(evt) {
			if (!_attached) return;
			utils.log("Error playing media: %o", _videotag.error);
			_eventDispatcher.sendEvent(events.JWPLAYER_MEDIA_ERROR, {message: "Error loading media: File could not be played"});
			_setState(states.IDLE);
		}

		function _sendLevels(levels) {
			if (utils.typeOf(levels)=="array" && levels.length > 0) {
				var publicLevels = [];
				for (var i=0; i<levels.length; i++) {
					var level = levels[i], publicLevel = {};
					publicLevel.label = _levelLabel(level) ? _levelLabel(level) : i;
					if (level.width) publicLevel.width = level.width;
					if (level.height) publicLevel.height = level.height;
					if (level.bitrate) publicLevel.bitrate = level.bitrate;
					publicLevels[i] = publicLevel;
				}
				_eventDispatcher.sendEvent(events.JWPLAYER_MEDIA_LEVELS, { levels: publicLevels, currentQuality: _currentQuality });
			}
		}
		
		function _levelLabel(level) {
			if (level.label) return level.label;
			else if (level.height) return level.height + "p";
			else if (level.width) return Math.round(level.width * 9 / 16) + "p";
			else if (level.bitrate) return level.bitrate + "kbps";
			else return 0;
		}
		
		_this.load = function(item) {
			if (!_attached) return;
			_item = item;
			_delayedSeek = 0;
			_duration = item.duration ? item.duration : -1;
			_position = 0;
			
			if (_currentQuality < 0) _currentQuality = 0;
			_levels = _item.sources;
			_sendLevels(_levels);
			
			_completeLoad();
		}
		
		function _completeLoad() {
			_canSeek = false;
			_bufferFull = false;
			_source = _levels[_currentQuality];
			
			_setState(states.BUFFERING); 
			_videotag.src = _source.file;
			_videotag.load();
			
			_bufferInterval = setInterval(_sendBufferUpdate, 100);

			if (utils.isIPod()) {
				_sendBufferFull();
			}
		}

		var _stop = _this.stop = function() {
			if (!_attached) return;
			_videotag.removeAttribute("src");
			_videotag.load();
			_currentQuality = -1;
			clearInterval(_bufferInterval);
			_setState(states.IDLE);
		}

		_this.play = function() {
			if (_attached) _videotag.play();
		}

		var _pause = _this.pause = function() {
			if (_attached) {
				_videotag.pause();
				_setState(states.PAUSED);
			}
		}
			
		_this.seekDrag = function(state) {
			if (!_attached) return; 
			_dragging = state;
			if (state) _videotag.pause();
			else _videotag.play();
		}
		
		var _seek = _this.seek = function(pos) {
			if (!_attached) return; 
			if (_videotag.readyState >= _videotag.HAVE_FUTURE_DATA) {
				_delayedSeek = 0;
				_videotag.currentTime = pos;
			} else {
				_delayedSeek = pos;
			}
		}
		
		function _sendSeekEvent() {
			if (!_dragging) {
				_sendEvent(events.JWPLAYER_MEDIA_SEEK, {
					position: _position,
					offset: _videotag.currentTime
				});
			}
		}

		var _volume = _this.volume = function(vol) {
			_videotag.volume = vol / 100;
		}
		
		function _volumeHandler(evt) {
			_sendEvent(events.JWPLAYER_MEDIA_VOLUME, {
				volume: Math.round(_videotag.volume * 100)
			});
			_sendEvent(events.JWPLAYER_MEDIA_MUTE, {
				mute: _videotag.muted
			});
		}
		
		_this.mute = function(state) {
			if (!utils.exists(state)) state = !_videotag.mute;
			if (state) {
				if (!_videotag.muted) {
					_lastVolume = _videotag.volume * 100;
					_videotag.muted = true;
					_volume(0);
				}
			} else {
				if (_videotag.muted) {
					_volume(_lastVolume);
					_videotag.muted = false;
				}
			}
		}

		/** Set the current player state * */
		function _setState(newstate) {
			// Handles a FF 3.5 issue
			if (newstate == states.PAUSED && _state == states.IDLE) {
				return;
			}
			
			// Ignore state changes while dragging the seekbar
			if (_dragging) return

			if (_state != newstate) {
				var oldstate = _state;
				_state = newstate;
				_sendEvent(events.JWPLAYER_PLAYER_STATE, {
					oldstate : oldstate,
					newstate : newstate
				});
			}
		}
		
		function _sendBufferUpdate() {
			if (!_attached) return; 
			var newBuffer = _getBuffer();
			if (newBuffer != _bufferPercent) {
				_bufferPercent = newBuffer;
				_sendEvent(events.JWPLAYER_MEDIA_BUFFER, {
					bufferPercent: Math.round(_bufferPercent * 100)
				});
			}
			if (newBuffer >= 1) {
				clearInterval(_bufferInterval);
			}
		}
		
		function _getBuffer() {
			if (_videotag.buffered.length == 0 || _videotag.duration == 0)
				return 0;
			else
				return _videotag.buffered.end(_videotag.buffered.length-1) / _videotag.duration;
		}
		

		function _complete() {
			//_stop();
			_currentQuality = -1;
			_setState(states.IDLE);
			_sendEvent(events.JWPLAYER_MEDIA_BEFORECOMPLETE);
			_sendEvent(events.JWPLAYER_MEDIA_COMPLETE);
		}
		

		/**
		 * Return the video tag and stop listening to events  
		 */
		_this.detachMedia = function() {
			_attached = false;
			return _videotag;
		}
		
		/**
		 * Begin listening to events again  
		 */
		_this.attachMedia = function() {
			_attached = true;
		}
		
		// Provide access to video tag
		// TODO: remove; used by InStream
		_this.getTag = function() {
			return _videotag;
		}
		
		_this.audioMode = function() {
			if (!_levels) { return false; }
			var type = _levels[0].type;
			return (type == "aac" || type == "mp3" || type == "vorbis");
		}

		_this.setCurrentQuality = function(quality) {
			if (_currentQuality == quality) return;
			
			if (quality >=0) {
				if (_levels && _levels.length > quality) {
					_currentQuality = quality;
					_sendEvent(events.JWPLAYER_MEDIA_LEVEL_CHANGED, { currentQuality: quality, levels: _levels} );
					var currentTime = _videotag.currentTime;
					_completeLoad();
					_this.seek(currentTime);
				}
			}
		}
		
		_this.getCurrentQuality = function() {
			return _currentQuality;
		}
		
		_this.getQualityLevels = function() {
			return _levels;
		}
		
		// Call constructor
		_init(videotag);

	}

})(jwplayer);/**
 * jwplayer.html5 namespace
 * 
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var jw = jwplayer, 
		utils = jw.utils, 
		events = jwplayer.events, 
		states = events.state,
		_css = utils.css, 
		_bounds = utils.bounds,

		DOCUMENT = document, 
		PLAYER_CLASS = "jwplayer", 
		FULLSCREEN_SELECTOR = "."+PLAYER_CLASS+".jwfullscreen",
		VIEW_MAIN_CONTAINER_CLASS = "jwmain",
		VIEW_INSTREAM_CONTAINER_CLASS = "jwinstream",
		VIEW_VIDEO_CONTAINER_CLASS = "jwvideo", 
		VIEW_CONTROLS_CONTAINER_CLASS = "jwcontrols",
		VIEW_PLAYLIST_CONTAINER_CLASS = "jwplaylistcontainer",
		
		/*************************************************************
		 * Player stylesheets - done once on script initialization;  *
		 * These CSS rules are used for all JW Player instances      *
		 *************************************************************/

		TRUE = true,
		FALSE = false,
		
		JW_CSS_SMOOTH_EASE = "opacity .5s ease",
		JW_CSS_100PCT = "100%",
		JW_CSS_ABSOLUTE = "absolute",
		JW_CSS_IMPORTANT = " !important",
		JW_CSS_HIDDEN = "hidden";

	html5.view = function(api, model) {
		var _api = api, 
			_model = model, 
			_playerElement,
			_container,
			_controlsLayer,
			_playlistLayer,
			_controlsTimeout=0,
			_timeoutDuration = 2000,
			_videoTag,
			_videoLayer,
			_instreamLayer,
			_controlbar,
			_display,
			_dock,
			_playlist,
			_audioMode,
			_isMobile = utils.isMobile(),
			_isIPad = utils.isIPad(),
			_forcedControls = (_model.mobilecontrols),
			_replayState,
			_readyState,
			_eventDispatcher = new events.eventdispatcher();
		
		utils.extend(this, _eventDispatcher);

		function _init() {
			utils.cssReset();
			
			_playerElement = _createElement("div", PLAYER_CLASS);
			_playerElement.id = _api.id;
			
			var replace = document.getElementById(_api.id);
			replace.parentNode.replaceChild(_playerElement, replace);
		}
		
		this.setup = function(skin) {
			_api.skin = skin;
			
			_container = _createElement("span", VIEW_MAIN_CONTAINER_CLASS);
			_videoLayer = _createElement("span", VIEW_VIDEO_CONTAINER_CLASS);
			
			_videoTag = _model.getVideo().getTag();
			_videoLayer.appendChild(_videoTag);
			_controlsLayer = _createElement("span", VIEW_CONTROLS_CONTAINER_CLASS);
			_instreamLayer = _createElement("span", VIEW_INSTREAM_CONTAINER_CLASS);
			_playlistLayer = _createElement("span", VIEW_PLAYLIST_CONTAINER_CLASS);

			_setupControls();
			
			_container.appendChild(_videoLayer);
			_container.appendChild(_controlsLayer);
			_container.appendChild(_instreamLayer);
			
			var newContainer = _createElement("div");
			newContainer.style.position="absolute";
			newContainer.style.width="100%";
			newContainer.style.height="100%";
			newContainer.appendChild(_container);
			newContainer.appendChild(_playlistLayer);
			_playerElement.appendChild(newContainer);
			
			DOCUMENT.addEventListener('webkitfullscreenchange', _fullscreenChangeHandler, FALSE);
			DOCUMENT.addEventListener('mozfullscreenchange', _fullscreenChangeHandler, FALSE);
			DOCUMENT.addEventListener('keydown', _keyHandler, FALSE);
			
			_api.jwAddEventListener(events.JWPLAYER_PLAYER_READY, _readyHandler);
			_api.jwAddEventListener(events.JWPLAYER_PLAYER_STATE, _stateHandler);
			_api.jwAddEventListener(events.JWPLAYER_PLAYLIST_COMPLETE, _playlistCompleteHandler);

			_stateHandler({newstate:states.IDLE});
			
			_controlsLayer.addEventListener('mouseout', _fadeControls, FALSE);
			_controlsLayer.addEventListener('mousemove', _startFade, FALSE);
			if (_controlbar) {
				_controlbar.element().addEventListener('mousemove', _cancelFade, FALSE);
				_controlbar.element().addEventListener('mouseout', _resumeFade, FALSE);
			}
			
		}
	
		function _createElement(elem, className) {
			var newElement = DOCUMENT.createElement(elem);
			if (className) newElement.className = className;
			return newElement;
		}
		
		function _startFade() {
			clearTimeout(_controlsTimeout);
			if (_api.jwGetState() == states.PLAYING || _api.jwGetState() == states.PAUSED) {
				_showControlbar();
				_showLogo();
				_showDock();
				if (!_inCB) {
					_controlsTimeout = setTimeout(_fadeControls, _timeoutDuration);
				}
			} else if (_replayState) {
				_showDock();
				_showLogo();
			}
		}
		
		var _inCB = FALSE;
		
		function _cancelFade() {
			clearTimeout(_controlsTimeout);
			_inCB = TRUE;
		}
		
		function _resumeFade() {
			_inCB = FALSE;
		}
		
		function _fadeControls() {
			if (_api.jwGetState() != states.BUFFERING) {
				_hideControlbar();
				_hideDock();
				_hideLogo();
			}
			clearTimeout(_controlsTimeout);
			_controlsTimeout = 0;
		}
		
		function _setupControls() {
			var width = _model.width,
				height = _model.height,
				cbSettings = _model.componentConfig('controlbar');
				displaySettings = _model.componentConfig('display');
		
			_display = new html5.display(_api, displaySettings);
			_display.addEventListener(events.JWPLAYER_DISPLAY_CLICK, function(evt) {
				// Forward Display Clicks
				_eventDispatcher.sendEvent(evt.type, evt);
			});
			_controlsLayer.appendChild(_display.element());
			
			_logo = new html5.logo(_api, _model.componentConfig('logo'));
			_controlsLayer.appendChild(_logo.element());
			
			_dock = new html5.dock(_api, _model.componentConfig('dock'));
			_controlsLayer.appendChild(_dock.element());
			
			if (_model.playlistsize && _model.playlistposition && _model.playlistposition != "none") {
				_playlist = new html5.playlistcomponent(_api, {});
				_playlistLayer.appendChild(_playlist.element());
			}
			
			if (!_isMobile || _forcedControls) {
				// TODO: allow override for showing HTML controlbar on iPads
				_controlbar = new html5.controlbar(_api, cbSettings);
				_controlsLayer.appendChild(_controlbar.element());
				if (_forcedControls) {
					_showControls();
				}
			} else {
				_videoTag.controls = TRUE;
			}
				
			_resize(width, height);
		}

		/** 
		 * Switch to fullscreen mode.  If a native fullscreen method is available in the browser, use that.  
		 * Otherwise, use the false fullscreen method using CSS. 
		 **/
		var _fullscreen = this.fullscreen = function(state) {
			if (!utils.exists(state)) {
				state = !_model.fullscreen;
			}

			if (state) {
				if (!_model.fullscreen) {
					_fakeFullscreen(TRUE);
					if (_playerElement.requestFullScreen) {
						_playerElement.requestFullScreen();
					} else if (_playerElement.mozRequestFullScreen) {
						_playerElement.mozRequestFullScreen();
					} else if (_playerElement.webkitRequestFullScreen) {
						_playerElement.webkitRequestFullScreen();
					}
					_model.setFullscreen(TRUE);
				}
			} else {
		    	_fakeFullscreen(FALSE);
				if (_model.fullscreen) {
				    if (DOCUMENT.cancelFullScreen) {  
				    	DOCUMENT.cancelFullScreen();  
				    } else if (DOCUMENT.mozCancelFullScreen) {  
				    	DOCUMENT.mozCancelFullScreen();  
				    } else if (DOCUMENT.webkitCancelFullScreen) {  
				    	DOCUMENT.webkitCancelFullScreen();  
				    }
					_model.setFullscreen(FALSE);
				}
			}
			if (_controlbar) _controlbar.redraw();
			if (_display) _display.redraw();
			_resizeMedia();
		}

		/**
		 * Resize the player
		 */
		function _resize(width, height) {
			if (_model.fullscreen) return;
			
			if (utils.exists(width) && utils.exists(height)) {
				_css(_internalSelector(), {
					width: width,
					height: height
				});
				_model.width = width;
				_model.height = height;
			}

			if (_display) _display.redraw();
			if (_controlbar) { 
				_controlbar.redraw();
			}
			if (_logo) {
				setTimeout(function() {
					_logo.offset(_controlbar && _logo.position().indexOf("bottom") >= 0 ? _controlbar.element().clientHeight + _controlbar.margin() : 0);
					if (_dock) _dock.offset(_logo.position() == "top-left" ? _logo.element().clientWidth + _logo.margin() : 0)
				}, 500);
			}

			var playlistSize = _model.playlistsize,
				playlistPos = _model.playlistposition
			
			if (_playlist && playlistSize && playlistPos) {
				_playlist.redraw();
				
				var playlistStyle = { display: "block" }, containerStyle = {};
				playlistStyle[playlistPos] = 0;
				containerStyle[playlistPos] = playlistSize;
				
				if (playlistPos == "left" || playlistPos == "right") {
					playlistStyle.width = playlistSize;
				} else {
					playlistStyle.height = playlistSize;
				}
				
				_css(_internalSelector(VIEW_PLAYLIST_CONTAINER_CLASS), playlistStyle);
				_css(_internalSelector(VIEW_MAIN_CONTAINER_CLASS), containerStyle);
			}
			
			_checkAudioMode(height);
			_resizeMedia();

			return;
		}
		
		function _checkAudioMode(height) {
			_audioMode = (!!_controlbar && height <= 40 && height.toString().indexOf("%") < 0);
			if (_controlbar) {
				if (_audioMode) {
					_controlbar.audioMode(TRUE);
					_showControlbar();
					_hideDisplay();
					_showVideo(FALSE);
				} else {
					_controlbar.audioMode(FALSE);
					_updateState(_api.jwGetState());
				}
			}
			if (_logo && _audioMode) {
				_hideLogo();
			}
			_css(_internalSelector(), {
				'background-color': _audioMode ? 'transparent' : _display.getBGColor()
			});
		}
		
		function _resizeMedia() {
			utils.stretch(_model.fullscreen ? utils.stretching.UNIFORM : _model.stretching, 
					_videoTag, 
					_videoLayer.clientWidth, _videoLayer.clientHeight, 
					_videoTag.videoWidth, _videoTag.videoHeight);
		}
		
		this.resize = _resize;
		this.resizeMedia = _resizeMedia;

		var _completeSetup = this.completeSetup = function() {
			_css(_internalSelector(), {opacity: 1});
		}
		
		/**
		 * Listen for keystrokes while in fullscreen mode.  
		 * ESC returns from fullscreen
		 * SPACE toggles playback
		 **/
		function _keyHandler(evt) {
			if (_model.fullscreen) {
				switch (evt.keyCode) {
				// ESC
				case 27:
					_fullscreen(FALSE);
					break;
				// SPACE
//				case 32:
//					if (_model.state == states.PLAYING || _model.state = states.BUFFERING)
//						_api.jwPause();
//					break;
				}
			}
		}
		
		/**
		 * False fullscreen mode. This is used for browsers without full support for HTML5 fullscreen.
		 * This method sets the CSS of the container element to a fixed position with 100% width and height.
		 */
		function _fakeFullscreen(state) {
			if (state) {
				_playerElement.className += " jwfullscreen";
			} else {
				_playerElement.className = _playerElement.className.replace(/\s+jwfullscreen/, "");
			}
		}

		/**
		 * Return whether or not we're in native fullscreen
		 */
		function _isNativeFullscreen() {
			var fsElements = [DOCUMENT.mozFullScreenElement, DOCUMENT.webkitCurrentFullScreenElement];
			for (var i=0; i<fsElements.length; i++) {
				if (fsElements[i] && fsElements[i].id == _api.id)
					return TRUE;
			}
			return FALSE;
		}
		
		/**
		 * If the browser enters or exits fullscreen mode (without the view's knowing about it) update the model.
		 **/
		function _fullscreenChangeHandler(evt) {
			_model.setFullscreen(_isNativeFullscreen());
			_fullscreen(_model.fullscreen);
		}
		
		function _showControlbar() {
			if (_controlbar && _model.controlbar) _controlbar.show();
		}
		function _hideControlbar() {
			if (_controlbar && !_audioMode && !_forcedControls) {
				_controlbar.hide();
//				_setTimeout(function() { _controlbar.style.display="none")
			}
		}
		
		function _showDock() {
			if (_dock && !_audioMode) _dock.show();
		}
		function _hideDock() {
			if (_dock && (!_forcedControls || _audioMode)) _dock.hide();
		}

		function _showLogo() {
			if (_logo && !_audioMode) _logo.show();
		}
		function _hideLogo() {
			if (_logo && (!_forcedControls || _audioMode)) _logo.hide();
		}

		function _showDisplay() {
			if (_display && !_audioMode) _display.show();
			if (_isMobile && !_forcedControls) {
				_controlsLayer.style.display = "block";
			}
		}
		function _hideDisplay() {
			if (_display) {
				if (_isMobile && !_forcedControls) {
					_controlsLayer.style.display = "none";
				}
				_display.hide();
			}
		}

		function _hideControls() {
			_hideControlbar();
			_hideDock();
			_hideLogo();
			_sendControlsEvent();
		}

		function _showControls() {
			_showControlbar();
			_showDisplay();
			_showDock();
			_showLogo();
			_sendControlsEvent();
		}

		function _sendControlsEvent() {
			var height = _bounds(_container).height,
				y = 0;
			if (_controlbar && _controlbar.visible) {
				height -= _bounds(_controlbar.element()).height;
			}
			if (_dock && _dock.visible) {
				y = _bounds(_dock.element()).height;
			}
			if (_dock) {}
			
		}
		
		// Subtracts rect2 rectangle from rect1 rectangle's area
		function _subtractRect(rect1, rect2) {
			if (rect2.right < rect1.left || rect2.left > rect1.right) return rect1;
			if (rect2.bottom < rect1.top || rect2.top > rect1.bottom) return rect1;
			
			var bottomCutout = (rect2.y > rect2.height / 2),  
				newRect = {
					x: rect1.x,
					y: bottomCutout ? rect1.y : rect2.bottom,
					width: rect1.width,
				};
			
		}
		
		function _showVideo(state) {
			state = state && !_audioMode;
			_css(_internalSelector(VIEW_VIDEO_CONTAINER_CLASS), {
				visibility: state ? "visible" : "hidden",
				opacity: state ? 1 : 0
			});
		}

		function _playlistCompleteHandler() {
			_replayState = TRUE;
		}

		function _readyHandler(evt) {
			_readyState = TRUE;
		}

		/**
		 * Player state handler
		 */
		var _stateTimeout;
		
		function _stateHandler(evt) {
			_replayState = FALSE;
			clearTimeout(_stateTimeout);
			_stateTimeout = setTimeout(function() {
				_updateState(evt.newstate);
			}, 100);
		}
		
		function _updateState(state) {
			switch(state) {
			case states.PLAYING:
				if (!_model.getVideo().audioMode() || _isMobile) {
					_showVideo(TRUE);
					_resizeMedia();
					_display.hidePreview(TRUE);
					if (_isMobile) {
						if (_isIPad && !_forcedControls) _videoTag.controls = TRUE;
						else { 
							_hideDisplay();
						}
					}
				}
				_startFade();
				break;
			case states.IDLE:
				if (!_isMobile) {
					_showVideo(FALSE);
				}
				//_hideControls();
				_fadeControls();
				_display.hidePreview(FALSE);
				_showDisplay();
				if (_isIPad) _videoTag.controls = FALSE;
				break;
			case states.BUFFERING:
				if (_isMobile) _showVideo(TRUE);
				else _showControls();
				break;
			case states.PAUSED:
				if (!_isMobile || _forcedControls) {
					_showControls();
				} else if (_isIPad) {
					_videoTag.controls = FALSE;
				}
				break;
			}
		}
		
		function _internalSelector(className) {
			return '#' + _api.id + (className ? " ." + className : "");
		}
		
		this.setupInstream = function(instreamDisplay, instreamVideo) {
			_setVisibility(_internalSelector(VIEW_INSTREAM_CONTAINER_CLASS), TRUE);
			_setVisibility(_internalSelector(VIEW_CONTROLS_CONTAINER_CLASS), FALSE);
			_instreamLayer.appendChild(instreamDisplay);
			_instreamVideo = instreamVideo;
			_stateHandler({newstate:states.PLAYING});
			_instreamMode = TRUE;
		}
		
		var _destroyInstream = this.destroyInstream = function() {
			_setVisibility(_internalSelector(VIEW_INSTREAM_CONTAINER_CLASS), FALSE);
			_setVisibility(_internalSelector(VIEW_CONTROLS_CONTAINER_CLASS), TRUE);
			_instreamLayer.innerHTML = "";
			_instreamVideo = null;
			_instreamMode = FALSE;
			_resize(_model.width, _model.height);
		}
		
		this.setupError = function(message) {
			jwplayer.embed.errorScreen(_playerElement, message);
			_completeSetup();
		}
		
		function _setVisibility(selector, state) {
			_css(selector, { display: state ? "block" : "none" });
		}
		
		this.addButton = function(icon, label, handler, id) {
			if (_dock) _dock.addButton(icon, label, handler, id);
		}

		this.removeButton = function(id) {
			if (_dock) _dock.removeButton(id);
		}

		_init();

		
	}

	// Container styles
	_css('.' + PLAYER_CLASS, {
		position: "relative",
		opacity: 0,
    	'-webkit-transition': JW_CSS_SMOOTH_EASE,
    	'-moz-transition': JW_CSS_SMOOTH_EASE,
    	'-o-transition': JW_CSS_SMOOTH_EASE
	});

	_css('.' + VIEW_MAIN_CONTAINER_CLASS, {
		position : JW_CSS_ABSOLUTE,
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
    	'-webkit-transition': JW_CSS_SMOOTH_EASE,
    	'-moz-transition': JW_CSS_SMOOTH_EASE,
    	'-o-transition': JW_CSS_SMOOTH_EASE
	});

	_css('.' + VIEW_VIDEO_CONTAINER_CLASS + ' ,.'+ VIEW_CONTROLS_CONTAINER_CLASS, {
		position : JW_CSS_ABSOLUTE,
		height : JW_CSS_100PCT,
		width: JW_CSS_100PCT,
    	'-webkit-transition': JW_CSS_SMOOTH_EASE,
    	'-moz-transition': JW_CSS_SMOOTH_EASE,
    	'-o-transition': JW_CSS_SMOOTH_EASE
	});

	_css('.' + VIEW_VIDEO_CONTAINER_CLASS, {
		visibility: "hidden"
	});

	_css('.' + VIEW_VIDEO_CONTAINER_CLASS + " video", {
		background : "transparent",
		width : JW_CSS_100PCT,
		height : JW_CSS_100PCT
	});

	_css('.' + VIEW_PLAYLIST_CONTAINER_CLASS, {
		position: JW_CSS_ABSOLUTE,
		height : JW_CSS_100PCT,
		width: JW_CSS_100PCT,
		display: "none"
	});
	
	_css('.' + VIEW_INSTREAM_CONTAINER_CLASS, {
		position: JW_CSS_ABSOLUTE,
		top: 0,
		left: 0,
		bottom: 0,
		right: 0,
		display: 'none'
	});

	// Fullscreen styles
	
	_css(FULLSCREEN_SELECTOR, {
		width: JW_CSS_100PCT,
		height: JW_CSS_100PCT,
		left: 0, 
		right: 0,
		top: 0,
		bottom: 0,
		'z-index': 1000,
		position: "fixed"
	}, TRUE);

	_css(FULLSCREEN_SELECTOR + ' .'+ VIEW_MAIN_CONTAINER_CLASS, {
		left: 0, 
		right: 0,
		top: 0,
		bottom: 0
	}, TRUE);

	_css(FULLSCREEN_SELECTOR + ' .'+ VIEW_PLAYLIST_CONTAINER_CLASS, {
		display: "none"
	}, TRUE);
	
	_css('.' + PLAYER_CLASS+' .jwuniform', {
		'background-size': 'contain' + JW_CSS_IMPORTANT
	});

	_css('.' + PLAYER_CLASS+' .jwfill', {
		'background-size': 'cover' + JW_CSS_IMPORTANT,
		'background-position': 'center'
	});

	_css('.' + PLAYER_CLASS+' .jwexactfit', {
		'background-size': JW_CSS_100PCT + " " + JW_CSS_100PCT + JW_CSS_IMPORTANT
	});

})(jwplayer.html5);