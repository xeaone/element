
function Events () {}

Events.prototype.on = function (name, callback) {
	if (!this.events[name]) this.events[name] = [];
	this.events[name].push(callback);
};

Events.prototype.off = function (name, callback) {
	if (!this.events[name]) return;
	var index = this.events[name].indexOf(callback);
	if (this.events[name].indexOf(callback) > -1) this.events[name].splice(index, 1);
};

Events.prototype.emit = function (name) {
	if (!this.events[name]) return;
	var args = [].slice.call(arguments, 1);
	var events = this.events[name].slice();
	for (var i = 0, l = events.length; i < l; i++) events[i].apply(this, args);
};

module.exports = Events;
