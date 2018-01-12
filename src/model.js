import Observer from './lib/observer';
import Global from './global';

var Model = function (options) {
	options = options || {};

	this.data = {};

	Observer.create(this.data, this.listener);

};

// Model.traverse = function (data, keys, value) {
//
// 	if (typeof keys === 'string') {
// 		keys = [keys];
// 	}
//
// 	var v, p, path, result;
// 	var key = keys[keys.length-1];
//
// 	for (var i = 0, l = keys.length-1; i < l; i++) {
//
// 		if (!(keys[i] in data)) {
//
// 			if (value !== undefined) {
//
// 				v = isNaN(keys[i+1]) ? {} : [];
// 				p = keys.slice(0, i+1).join('.');
// 				v = Observer.defineProperty(data, keys[i], v, this.listener, p);
//
// 				this.listener(v, p, keys[i], data);
//
// 			} else {
// 				return undefined;
// 			}
//
// 		}
//
// 		data = data[keys[i]];
// 	}
//
// 	if (value !== undefined) {
// 		path = keys.join('.');
// 		result = Observer.defineProperty(data, key, value, this.listener, path);
// 		this.listener(result, path, keys, data);
// 	} else {
// 		result = data[key];
// 	}
//
// 	return result;
// };

Model.prototype.get = function (keys) {
	// return this.traverse(this.data, keys);
};

Model.prototype.set = function (keys, value) {
	// return this.traverse(this.data, keys, value);
};

Model.prototype.listener = function (data, path) {

	var paths = path.split('.');
	var uid = paths[0];
	var type = data === undefined ? 'unrender' : 'render';

	path = paths.slice(1).join('.');

	if (!path) {
		return;
	}

	Global.binder.each(uid, path, function (binder) {
		Global.binder[type](binder);
	});

};

export default Model;
