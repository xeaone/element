
function clone (target, source) {

	target = target || source.constructor();

	Object.keys(source).forEach(function (key) {

		if (self.isCollection(source[key])) {
			target[key] = clone(source[key]);
		} else {
			target[key] = source[key];
		}

	});

	return target;
}
