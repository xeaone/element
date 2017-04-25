(function() {

	var View = {};

	function eachElement (scope, callback) {
		var elements = scope.getElementsByTagName('*');
		for (var i = 0; i < elements.length; i++) {
			callback(elements[i], i === elements.length - 1);
		}
	}

	function eachAttribute (element, callback) {
		var attributes = element.attributes;
		for (var i = 0; i < attributes.length; i++) {
			callback({
				name: attributes[i].name,
				value: attributes[i].value,
				full: attributes[i].name + '="' + attributes[i].value + '"'
			}, i === attributes.length - 1);
		}
	}

	function createView (scope, pattern, callback) {
		var view = {};

		eachElement(scope, function (element, lastElement) {
			eachAttribute(element, function (attribute, lastAttribute) {
				if (pattern.test(attribute.full)) {

					if (!(attribute.value in view)) {
						view[attribute.value] = [];
					}

					view[attribute.value].push({
						element: element,
						attribute: attribute
					});

					if (lastElement && lastAttribute) {
						return callback(view);
					}

				}
			});
		});
	}

	function descriptor (k, v, c) {
		return {
			configurable: true,
			enumerable: true,
			get: function () {
				return v;
			},
			set: function (nv) {
				v = nv;
				c(k, v);
			}
		};
	}

	function createModel (observable, callback, prefix) { //trigger
		var observed, key, value, type;

		prefix = !prefix ? prefix = '' : prefix += '.'
		type = observable.constructor.name;
		observed = type === 'Object' ? {} : [];

		observed = Object.defineProperty(observed, 'ins', {
			value: this.ins.bind(this, observed, callback, prefix)
		});

		observed = Object.defineProperty(observed, 'del', {
			value: this.del.bind(this, observed, callback, prefix)
		});

		for (key in observable) {
			value = observable[key];
			type = value.constructor.name;

			if (type === 'Object' || type === 'Array') value = createModel(value, callback, prefix + key);
			observed = Object.defineProperty(observed, key, descriptor(prefix + key, value, callback));
			// if (trigger && callback) callback(prefix + key, value);
		}

		return observed;
	}


	function html (string) {
		var container = document.createElement('div');
		container.innerHTML = string;
		return container;
	}

	window.render = function (scope, model) {
		if (typeof scope === 'string') {
			scope = html(scope);
		}

		createView(scope, /j-|data-j-/, function (view) {
			createModel(model, function (key, value) {
				view[key].forEach(function (e) {
					e.element.innerText = value;
				});
			});
		});
	};

}());
