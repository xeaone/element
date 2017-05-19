
function clone (data) {
	var collection = Object.create(Object.getPrototypeOf(data));

	Object.keys(data).forEach(function (key) {
		if (data[key] && typeof data[key] === 'object') {
			collection[key] = this.clone(data[key]);
		} else {
			Object.defineProperty(collection, key,
				Object.getOwnPropertyDescriptor(data, key)
			);
		}
	}, this);

	return collection;
}
