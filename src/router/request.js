
function Request (data) {
	this.route = data.route;
	this.state = data.state;
}

module.exports = function (data) {
	return new Request(data);
};
