import Global from '../global';

var Setup = {};

Setup.on = function (opt, callback) {
	var data = Global.binder.getData(opt);
	opt.cache = data.bind(opt.model);
	opt.element.addEventListener(opt.names[1], opt.cache);
	callback();
};

Setup.each = function (opt, callback) {

	opt.variable = opt.names[1];
	opt.pattern = new RegExp('\\$(' + opt.variable + '|index)', 'ig');

	// opt.clone = opt.element.removeChild(opt.element.firstElementChild);
    //
	// opt.clone = opt.clone.outerHTML.replace(
	// 	new RegExp('((?:data-)?o-.*?=")' + opt.variable + '((?:\\.\\w+)*\\s*(?:\\|.*?)?")', 'g'),
	// 	'$1' + opt.path + '.$' + opt.variable + '$2'
	// );

	Global.batcher.read(function () {
		var element = opt.element.children[0];

		Global.batcher.write(function () {

			opt.clone = opt.element.removeChild(element);

			opt.clone = opt.clone.outerHTML.replace(
				new RegExp('((?:data-)?o-.*?=")' + opt.variable + '((?:\\.\\w+)*\\s*(?:\\|.*?)?")', 'g'),
				'$1' + opt.path + '.$' + opt.variable + '$2'
			);

			callback();
		});

	});

};

export default Setup;
