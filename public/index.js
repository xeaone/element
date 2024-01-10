// import { router } from './x-element.js';

const main = document.querySelector('main');

switch (location.pathname.toLowerCase().replace(/\/+$/, '')) {
    case '': await import('./root.js');
    case '/guide': await import('./guide.js');
}


// router('/', main, () => import('./root.js'));
// router('/guide', main, () => import('./guide.js'));
// router('/guide/', main, () => import('./guide.js'));
// router('/security', main, () => import('./security.js'));
// router('/security/', main, () => import('./security.js'));
// router('/*', main, () => import('./all.js'));
// location.replace(location.href);
