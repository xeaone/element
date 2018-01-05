import Global from '../global';

var Setup = {};

Setup.disable = function (opt) {
	if (opt.data === undefined) {
		opt.data = Global.model.set(opt.keys, true);
	}
};

Setup.enable = function (opt) {
	if (opt.data === undefined) {
		opt.data = Global.model.set(opt.keys, true);
	}
};

Setup.hide = function (opt) {
	if (opt.data === undefined) {
		opt.data = Global.model.set(opt.keys, true);
	}
};

Setup.read = function (opt) {
	if (opt.data === undefined) {
		opt.data = Global.model.set(opt.keys, true);
	}
};

Setup.required = function (opt) {
	if (opt.data === undefined) {
		opt.data = Global.model.set(opt.keys, true);
	}
};

Setup.selected = function (opt) {
	if (opt.data === undefined) {
		opt.data = Global.model.set(opt.keys, 0);
	}
};

Setup.show = function (opt) {
	if (opt.data === undefined) {
		opt.data = Global.model.set(opt.keys, true);
	}
};

Setup.write = function (opt) {
	if (opt.data === undefined) {
		opt.data = Global.model.set(opt.keys, true);
	}
};

Setup.value = function (opt) {
	if (opt.element.type === 'checkbox') {
		if (opt.data === undefined) {
			Global.batcher.write(function () {
				opt.element.value = opt.data;
				opt.element.checked = opt.data;
				opt.data = Global.model.set(opt.keys, false);
			});
		} else {
			console.log(opt.setup);
		}
	}
};

Setup.on = function (opt) {
	opt.cache = Global.utility.getByPath(Global.events.data, opt.uid + '.' + opt.path).bind(opt.model);
	opt.element.addEventListener(opt.names[1], opt.cache);
};

Setup.each = function (opt) {

	if (!opt.data) {
		opt.data = Global.model.set(opt.keys, []);
	}

	opt.variable = opt.names[1];
	opt.pattern = new RegExp('\\$(' + opt.variable + '|index)', 'ig');

	opt.clone = opt.element.removeChild(opt.element.firstElementChild);

	opt.clone = opt.clone.outerHTML.replace(
		new RegExp('((?:data-)?o-.*?=")' + opt.variable + '((?:\\.\\w+)*\\s*(?:\\|.*?)?")', 'g'),
		'$1' + opt.path + '.$' + opt.variable + '$2'
	);

};

export default Setup;
