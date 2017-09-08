import Router from './router';
import Loader from './loader';
import Model from './model';
import View from './view';
import Http from './http';

var Global = {
	view: {},
	model: {},
	events: {},
	modifiers: {},

	Http: new Http(Global),
	View: new View(Global),
	Model: new Model(Global),
	Loader: new Loader(Global),
	Router: new Router(Global)
};

export default Global;
