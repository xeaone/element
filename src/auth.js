import INDEX from './index';

export default function Auth (options) {
	this.index = INDEX;
	this.setup(options);
}

Auth.prototype.setup = function (options) {
	options = options || {};

};

// {
// 	headers: {
// 	  Authorization: 'Bearer ' + localStorage.getItem('token')
// 	},
// 	method: 'GET',
// 	cache: false
// }

Auth.prototype.verify = function (options) {
	// window.localStorage.setItem('token', token);
	// window.localStorage.setItem('profile', JSON.stringify(profile));
};

// request: function (options) {
// 	options.headers['Authorization'] = Jenie.globals.token;
// },
// response: function (_, xhr) {
// 	if (!Jenie.globals.token && Jenie.router.state.location.pathname !== '/sign-in') {
// 		Jenie.router.navigate('/sign-in');
// 		return false;
// 	} else if (xhr.status === 401) {
// 		Jenie.router.navigate('/sign-in');
// 		return false;
// 	} else if (xhr.status > 400) {
// 		// make a way to send a payload with the response
// 		// Jenie.state.payload = JSON.parse(res.responseText);
// 		Jenie.router.navigate('/error');
// 		return false;
// 	}
// }
