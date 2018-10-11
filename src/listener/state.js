import Router from '../router.js';

export default function (e) {

	const path = e && e.state ? e.state.path : window.location.href;
	
	Router.route(path, { replace: true });

}
