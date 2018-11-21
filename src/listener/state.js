import Router from '../router.js';

export default function (event) {

	var path = event && event.state ? event.state.path : window.location.href;

	Promise.resolve().then(function () {
		return Router.route(path, { replace: true });
	}).catch(console.error);
};
