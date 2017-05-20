
// var rElementAccepts = /(data-)?j-/;
var ELEMENT_REJECTS_CHILDREN = /(data-)?j-each/;
var ELEMENT_REJECTS = /^\w+(-\w+)+|^iframe|^object|^script/;

function preview (element) {
	return element.outerHTML
	.replace(/\/?>([\s\S])*/, '')
	.replace(/^</, '');
}

function qsa (pattern, callback, elements) {
	elements = elements.getElementsByTagName('*');

	for (var i = 0; i < elements.length; i++) {
		var element = elements[i];
		var p = preview(element);

		if (ELEMENT_REJECTS.test(p)) {
			i += element.querySelectorAll('*').length;
		} else if (ELEMENT_REJECTS_CHILDREN.test(p)) {
			i += element.querySelectorAll('*').length;
			callback(element);
		} else if (pattern.test(p)) {
			callback(element);
		}
	}
}
