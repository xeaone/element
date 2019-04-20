import Router from '../router.js';

export default function (event) {
    const path = event && event.state ? event.state.path : window.location.href;
    const route = Router.route(path, { mode: 'replace' });
    Promise.resolve(route);
}
