import Binder from './index';

var Setup = {};

Setup.on = function (opt) {
	var data = Binder.getData(opt);

	opt.cache = data.bind(opt.model);
	opt.element.addEventListener(opt.names[1], opt.cache);
};

Setup.each = function (opt) {

	opt.clone = opt.element.removeChild(opt.element.firstElementChild);

	opt.variable = opt.names[1];
	opt.pattern = new RegExp('\\$(' + opt.variable + '|index)', 'ig');

	opt.clone = opt.clone.outerHTML.replace(
		new RegExp('((?:data-)?o-.*?=")' + opt.variable + '((?:\\.\\w+)*\\s*(?:\\|.*?)?")', 'g'),
		'$1' + opt.path + '.$' + opt.variable + '$2'
	);

};

export default Setup;
