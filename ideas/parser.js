'use strict';

// TODO need to test

const END_TAG = /^<\/([-A-Za-z0-9_]+)[^>]*>/;
const ATTRIBUTE = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g;
const START_TAG = /^<([-A-Za-z0-9_]+)((?:\s+[a-zA-Z_:][-a-zA-Z0-9_:.]*(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/;

module.exports = {

	types: {
		SPECIAL: [
			'script','style'
		],
		CLOSE_SELF: [
			'colgroup','dd','dt','li','options',
			'p','td','tfoot','th','thead','tr'
		],
		EMPTY: [
			'area','base','basefont','br','col','frame','hr','img','input',
			'link','meta','param','embed','command','keygen','source','track','wbr'
		],
		FILL_ATTRIBUTES: [
			'checked','compact','declare','defer','disabled','ismap',
			'multiple','nohref','noresize','noshade','nowrap','readonly','selected'
		],
		INLINE: [
			'abbr','acronym','applet','b','basefont','bdo','big','br','button',
			'cite','code','del','dfn','em','font','i','iframe','img','input','ins',
			'kbd','label','map','object','q','s','samp','script','select','small',
			'span','strike','strong','sub','sup','textarea','tt','u','var'
		],
		BLOCK: [
			'a','address','article','applet','aside','audio','blockquote','button','canvas',
			'center','dd','del','dir','div','dl','dt','fieldset','figcaption','figure','footer',
			'form','frameset','h1','h2','h3','h4','h5','h6','header','hgroup','hr','iframe','ins',
			'isindex','li','map','menu','noframes','noscript','object','ol','output','p','pre','section',
			'script','table','tbody','td','tfoot','th','thead','tr','ul','video','svg'
		]
	},

	is: function (type, name) {
		return this.types[type].indexOf(name) !== -1;
	},

	createTagStart: function (tag, attributes) {
		let result = `<${tag}`;

		for (let attribute of attributes) {
			if (attribute.value) {
				result += ` ${attribute.name}="${attribute.value}"`;
			} else {
				result += ` ${attribute.name}`;
			}
		}

		result += `>`;

		return result;
	},

	parseStartTag: function (data, tag, name, rest, unary) {
		name = name.toLowerCase();

		if (this.is('BLOCK', name)) {

			while ( data.stack.last() && this.is('INLINE', data.stack.last()) ) {
				this.parseEndTag(data, '', data.stack.last());
			}

		}

		if ( this.is('CLOSE_SELF', name) && data.stack.last() === name ) {
			this.parseEndTag(data, '', name);
		}

		unary = this.is('EMPTY', name) || !!unary;

		if (!unary) {
			data.stack.push(name);
		}

		if (data.start) {
			var attributes = [];

			rest.replace(ATTRIBUTE, function (match, name) {

				var value = arguments[2] ? arguments[2] :
					arguments[3] ? arguments[3] :
					arguments[4] ? arguments[4] :
					this.is('FILL_ATTRIBUTES', name) ? name : '';

				attributes.push({
					name: name,
					value: value
					// escaped: value.replace(/(^|[^\\])"/g, '$1\\\"')
				});

			});

			if (data.start) {
				data.start(name, attributes, unary);
			}

		}

	},

	parseEndTag: function (data, tag, name) {
		let position;

		// If no tag name is provided, clean shop
		if (!name) {

			position = 0;

		} else {

			// Find the closest opened tag of the same type
			for (position = data.stack.length - 1; position >= 0; position--) {

				if (data.stack[position] === name) {
					break;
				}

			}

		}

		if (position >= 0) {

			// Close all the open elements, up the stack
			for (var i = data.stack.length - 1; i >= position; i--) {

				if (data.end) {
					data.end(data.stack[i]);
				}

			}

			// Remove the open elements from the stack
			data.stack.length = position;
		}

	},

	html: function (data) {

		data.stack = [];
		data.last = data.html;

		if (data.html.indexOf('<!DOCTYPE html>') === 0) {
			data.html = data.html.slice(15);
		}

		data.stack.last = function () {
			return this[this.length-1];
		};

		while (data.html) {
			let isChars = true;
			let index, match;

			// Make sure we are not in a script or style element
			if ( !data.stack.last() || !this.is('SPECIAL', data.stack.last()) ) {

				// Comment
				if (data.html.indexOf('<!--') === 0) {
					index = data.html.indexOf('-->');

					if (index >= 0) {

						if (data.comment) {
							data.comment(data.html.substring(4, index));
						}

						data.html = data.html.substring(index + 3);
						isChars = false;
					}

					// end tag
				} else if (data.html.indexOf('</') === 0) {
					match = data.html.match(END_TAG);

					if (match) {
						data.html = data.html.substring(match[0].length);
						match[0].replace(END_TAG, this.parseEndTag.bind(this, data));
						isChars = false;
					}

					// start tag
				} else if (data.html.indexOf('<') === 0) {
					match = data.html.match(START_TAG);

					if (match) {
						data.html = data.html.substring(match[0].length);
						match[0].replace(START_TAG, this.parseStartTag.bind(this, data));
						isChars = false;
					}

				}

				if (isChars) {
					index = data.html.indexOf('<');

					var text = index < 0 ? data.html : data.html.substring(0, index);
					data.html = index < 0 ? '' : data.html.substring(index);

					if (data.chars) {
						data.chars(text);
					}

				}

			} else {
				var pattern = new RegExp(`([\\s\\S]*?)<\/${data.stack.last()}[^>]*>`);

				data.html = data.html.replace(pattern, function (all, text) {
					text = text.replace(/<!--([\s\S]*?)-->|<!\[CDATA\[([\s\S]*?)]]>/g, '$1$2');

					if (data.chars) {
						data.chars(text);
					}

					return '';
				});

				this.parseEndTag(data, '', data.stack.last());
			}

			if (data.html === data.last) {
				throw `Parse Error: ${html}`;
			}

			data.last = data.html;
		}

		// Clean up any remaining tags
		this.parseEndTag(data);

	}

};

/*
	Parser.html(string, {
    	start: function (tag, attributes, unary) {},
    	end: function (tag) {},
    	chars: function (text) {},
    	comment: function (text) {}
	});
*/
