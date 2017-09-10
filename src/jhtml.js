
var KEBAB = /[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g;

function toKebabCase (string) {
	return string.replace(KEBAB, function (match) {
		return '-' + match.toLowerCase();
	});
}

function parse (data) {
	if (typeof data === 'string') {
		return document.createTextNode(data);
	} else {
		var node = document.createElement(data['name']);

		if ('attributes' in data) {
			var attributes = data['attributes'];
			for (var key in attributes) {
				node.setAttribute(toKebabCase(key), attributes[key]);
			}
		}

		if ('children' in data) {
			var children = data['children'];
			if (children.constructor === String) {
				node.innerText = children;
			} else if (children.constructor === Object) {
				node.appendChild(parse(children[i]));
			} else if (children.constructor === Array) {
				for (var i = 0, l = children.length; i < l; i++) {
					node.appendChild(parse(children[i]));
				}
			}
		}

		return node;
	}
}

var jhtml = {
	name: 'fieldset',
	attributes: {
		jValue: 'value'
	},
	children: [
		{
			name: 'input',
			attributes: {
				jValue: 'foo.poo'
			}
		},
		{
			name: 'input',
			attributes: {
				jValue: 'bar.dar'
			}
		},
		{
			name: 'div',
			children: 'hello world'
		}
	]
};

console.log(parse(jhtml));
