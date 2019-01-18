
// FIXME import export in strings cause error
// FIXME double backtick in template strings or regex could possibly causes issues

(function (window) { 'use strict';

	if ('import' in window) {
		return;
	}

	var modules = {};

	var Normalize = function (data) {
		var parser = window.document.createElement('a');

		parser.href = data.replace(/\/{2,}/, '/');

		data = parser.pathname;
		data = data ? data : '/';

		if (data.slice(0, window.location.origin.length) === window.location.origin) {
			data = data.slice(window.location.origin.length);
		}

		if (data.slice(0, window.location.protocol.length) === window.location.protocol) {
			data = data.slice(window.location.protocol.length);
		}

		return data;
	};

	var Transformer = {
		/*
			templates
		*/
		innerHandler (char, index, string) {
			if (string[index-1] === '\\') return;
			if (char === '\'') return '\\\'';
			if (char === '\"') return '\\"';
			if (char === '\t') return '\\t';
			if (char === '\r') return '\\r';
			if (char === '\n') return '\\n';
			if (char === '\w') return '\\w';
			if (char === '\b') return '\\b';
		},
		updateString (value, index, string) {
			return string.slice(0, index) + value + string.slice(index+1);
		},
		updateIndex (value, index) {
			return index + value.length-1;
		},
		template (data) {

			var first = data.indexOf('`');
			var second = data.indexOf('`', first+1);

			if (first === -1 || second === -1) return data;

			var value;
			var ends = 0;
			var starts = 0;
			var string = data;
			var isInner = false;

			for (var index = 0; index < string.length; index++) {
				var char = string[index];

				if (char === '`' && string[index-1] !== '\\') {

					if (isInner) {
						ends++;
						value = '\'';
						isInner = false;
						string = this.updateString(value, index, string);
						index = this.updateIndex(value, index);
					} else {
						starts++;
						value = '\'';
						isInner = true;
						string = this.updateString(value, index, string);
						index = this.updateIndex(value, index);
					}

				} else if (isInner) {

					if (value = this.innerHandler(char, index, string)) {
						string = this.updateString(value, index, string);
						index = this.updateIndex(value, index);
					}

				}

			}

			string = string.replace(/\${(.*?)}/g, '\'+$1+\'');

			if (starts === ends) {
				return string;
			} else {
				throw new Error('import transformer missing backtick');
			}

		},
		/*
			modules
		*/
		exp: /export\s+default\s*(var|let|const)?/,
		imps: /import(?:\s+(?:\*\s+as\s+)?\w+\s+from)?\s+(?:'|").*?(?:'|");?\n?/g,
		imp: /import(?:\s+(?:\*\s+as\s+)?(\w+)\s+from)?\s+(?:'|")(.*?)(?:'|");?\n?/,
		module (code, url) {

			var base = url.slice(0, url.lastIndexOf('/') + 1);
			var before = 'return Promise.all([\n';
			var after = ']).then(function ($MODULES) {\n';

			var imps = code.match(this.imps) || [];

			for (var i = 0, l = imps.length; i < l; i++) {
			 	var imp = imps[i].match(this.imp);

				var rawImport = imp[0];
				var nameImport = imp[1];
				var pathImport = imp[2];

				if (pathImport.slice(0, 1) !== '/') {
					pathImport = Normalize(base + '/' + pathImport);
				} else {
					pathImport = Normalize(pathImport);
				}

				before = before + '\twindow.import("' + pathImport + '"),\n';
				after = after + 'var ' + nameImport + ' = $MODULES[' + i + '].default;\n';

				code = code.replace(rawImport, '');
			}

			if (this.exp.test(code)) {
				code = code.replace(this.exp, 'var $DEFAULT = ');
				code = code + '\n\nreturn { default: $DEFAULT };\n';
			}

			code = '"use strict";\n' + before + after + code + '});';

			return code;
		}
	};

	window.import = function (url) {

		url = Normalize(url);

		if (url in modules) {
			return modules[url];
		}

		return modules[url] = Promise.resolve().then(function () {
			if (!url) {
				throw new Error('import url argument required');
			}
		}).then(function () {
			return window.fetch(url);
		}).then(function (data) {
			if (data.status >= 200 && data.status < 300 || data.status == 304) {
				return data.text();
			} else if (data.status == 404) {
				throw new Error('import not found ' + url);
			} else {
				throw new Error(data.statusText);
			}
		}).then(function (code) {
			code = Transformer.template(code);
			code = Transformer.module(code, url);
			code = new Function('window', code);
			return code(window);
		});
	};

}(window));
