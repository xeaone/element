
export default function Events () {
	this.events = {};
}

Events.prototype.on = function (name, listener) {

	if (typeof this.events[name] !== 'object') {
		this.events[name] = [];
	}

	this.events[name].push(listener);
};

Events.prototype.off = function (name, listener) {

	if (typeof this.events[name] === 'object') {
		var index = this.events[name].indexOf(listener);

		if (index > -1) {
			this.events[name].splice(index, 1);
		}

	}

};

Events.prototype.once = function (name, listener) {
	this.on(name, function f () {
		this.off(name, f);
		listener.apply(this, arguments);
	});
};

Events.prototype.emit = function (name) {

	if (typeof this.events[name] === 'object') {
		var listeners = this.events[name].slice();
		var args = Array.prototype.slice.call(arguments, 1);

		for (var i = 0, l = listeners.length; i < l; i++) {
			listeners[i].apply(this, args);
		}

	}

};
