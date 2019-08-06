import Router from '../router.js';

export default async function (event) {
    const path = event && event.state ? event.state.path : window.location.href;
    Router.route(path, { mode: 'replace' });
}
