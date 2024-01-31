// import { router } from './x-element.js';

const main = document.querySelector('main');
const pathname = location.pathname.toLowerCase().replace(/\/+$/, '');

switch (pathname) {
    case '':
        await import('./root.js');
        break;
    case '/guide':
        await import('./guide.js');
        break;
}

// router('/', main, () => import('./root.js'));
// router('/guide', main, () => import('./guide.js'));
// router('/guide/', main, () => import('./guide.js'));
// router('/security', main, () => import('./security.js'));
// router('/security/', main, () => import('./security.js'));
// router('/*', main, () => import('./all.js'));
// location.replace(location.href);
