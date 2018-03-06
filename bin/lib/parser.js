'use strict';

const makeMap = function (string) {
	const result = {};
	const items = string.split(',');

	for (let item of items) {
		result[item] = true;
	}

	return result;
};

const endTag = /^<\/([-A-Za-z0-9_]+)[^>]*>/;
const attr = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g;
const startTag = /^<([-A-Za-z0-9_]+)((?:\s+[a-zA-Z_:][-a-zA-Z0-9_:.]*(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/;

const special = makeMap('script,style');
const closeSelf = makeMap('colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr');
const empty = makeMap('area,base,basefont,br,col,frame,hr,img,input,link,meta,param,embed,command,keygen,source,track,wbr');
const fillAttrs = makeMap('checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected');
const inline = makeMap('abbr,acronym,applet,b,basefont,bdo,big,br,button,cite,code,del,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,object,q,s,samp,script,select,small,span,strike,strong,sub,sup,textarea,tt,u,var');
const block = makeMap('a,address,article,applet,aside,audio,blockquote,button,canvas,center,dd,del,dir,div,dl,dt,fieldset,figcaption,figure,footer,form,frameset,h1,h2,h3,h4,h5,h6,header,hgroup,hr,iframe,ins,isindex,li,map,menu,noframes,noscript,object,ol,output,p,pre,section,script,table,tbody,td,tfoot,th,thead,tr,ul,video');

const Parser = {

	createTagStart: function (tag, attributes) {
		let result = `<${tag}`;

		for (let i = 0; i < attributes.length; i++) {
			result += ` ${attributes[i].name}="${attributes[i].value}"`;
		}

		result += `>`;

		return result;
	},

	html: function (html, handler) {
		let index, chars, match, stack = [], last = html;

		// if (html.indexOf('<!DOCTYPE html>') === 0) {
		// 	html = html.slice('<!DOCTYPE html>'.length);
		// }

		stack.last = function () {
			return this[this.length-1];
		};

		while (html) {
			chars = true;

			// Make sure we're not in a script or style element
			if (!stack.last() || !special[stack.last()]) {

				// Comment
				if (html.indexOf('<!--') == 0) {
					index = html.indexOf('-->');

					if (index >= 0) {

						if (handler.comment) {
							handler.comment(html.substring(4, index));
						}

						html = html.substring(index + 3);
						chars = false;
					}

					// end tag
				} else if (html.indexOf('</') == 0) {
					match = html.match(endTag);

					if (match) {
						html = html.substring(match[0].length);
						match[0].replace(endTag, parseEndTag);
						chars = false;
					}

					// start tag
				} else if (html.indexOf("<") == 0) {
					match = html.match(startTag);

					if (match) {
						html = html.substring(match[0].length);
						match[0].replace(startTag, parseStartTag);
						chars = false;
					}

				}

				if (chars) {
					index = html.indexOf('<');

					var text = index < 0 ? html : html.substring(0, index);
					html = index < 0 ? '' : html.substring(index);

					if (handler.chars) {
						handler.chars(text);
					}

				}

			} else {
				html = html.replace(new RegExp(`([\\s\\S]*?)<\/${stack.last()}[^>]*>`), function (all, text) {
					text = text.replace(/<!--([\s\S]*?)-->|<!\[CDATA\[([\s\S]*?)]]>/g, '$1$2');

					if (handler.chars) {
						handler.chars(text);
					}

					return '';
				});

				parseEndTag('', stack.last());
			}

			if (html == last) {
				throw `Parse Error: ${html}`;
			}

			last = html;
		}

		// Clean up any remaining tags
		parseEndTag();

		function parseStartTag(tag, tagName, rest, unary) {
			tagName = tagName.toLowerCase();

			if (block[tagName]) {
				while (stack.last() && inline[stack.last()]) {
					parseEndTag('', stack.last());
				}
			}

			if (closeSelf[tagName] && stack.last() == tagName) {
				parseEndTag('', tagName);
			}

			unary = empty[tagName] || !!unary;

			if (!unary) {
				stack.push(tagName);
			}

			if (handler.start) {
				var attrs = [];

				rest.replace(attr, function (match, name) {
					var value = arguments[2] ? arguments[2] :
						arguments[3] ? arguments[3] :
						arguments[4] ? arguments[4] :
						fillAttrs[name] ? name : '';

					attrs.push({
						name: name,
						value: value
						// escaped: value.replace(/(^|[^\\])"/g, '$1\\\"')
					});
				});

				if (handler.start) {
					handler.start(tagName, attrs, unary);
				}

			}

		}

		function parseEndTag (tag, tagName) {
			let position;

			// If no tag name is provided, clean shop
			if (!tagName) {
				position = 0;
			} else {

				// Find the closest opened tag of the same type
				for (position = stack.length - 1; position >= 0; position--) {

					if (stack[position] == tagName) {
						break;
					}

				}

			}

			if (position >= 0) {

				// Close all the open elements, up the stack
				for (let i = stack.length - 1; i >= position; i--) {

					if (handler.end) {
						handler.end(stack[i]);
					}

				}

				// Remove the open elements from the stack
				stack.length = position;
			}

		}

	}
};

module.exports = Parser;

/*
	Parser.html(string, {
    	start: function (tag, attributes, unary) {},
    	end: function (tag) {},
    	chars: function (text) {},
    	comment: function (text) {}
	});
*/
