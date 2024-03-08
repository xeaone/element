// import root from './root.js';
// import guide from './guide.js';

// const main = document.querySelector('main');
const pathname = location.pathname.toLowerCase().replace(/\/+$/, '');

switch (pathname) {
    case '':
        await import('./root.ts');
        break;
    case '/guide':
        await import('./guide.ts');
        break;
    case '/performance':
        await import('./performance.ts');
        break;
    default:
        await import('./all.ts');
}

// router('/', main, () => import('./root.js'));
// router('/guide', main, () => import('./guide.js'));
// router('/guide/', main, () => import('./guide.js'));
// router('/security', main, () => import('./security.js'));
// router('/security/', main, () => import('./security.js'));
// router('/*', main, () => import('./all.js'));
// location.replace(location.href);
