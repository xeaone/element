import Observer from './observer';

export default function Model () {}

Model.prototype.setListener = function (listener) {
	this.listener = listener;
};

Model.prototype.setData = function (data) {
	this.data = data;
};

Model.prototype.run = function () {
	Observer(this.data, this.listener);
};
