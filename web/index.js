// import XPoly from './x-poly.js';
import XElement from './x-element.js';

// await XPoly();

// navigation.addEventListener('navigate', (event) => {
//     const { pathname } = new URL(event.destination.url);
//     if (pathname !== '/') {
//         event.preventDefault();
//         event.stopImmediatePropagation();
//         return navigation.navigate('/');
//     }
// });

navigation.addEventListener('navigate', () => console.log('nav before'));

XElement.navigation('/', './root.js');
XElement.navigation('/guide', './guide.js');
XElement.navigation('/*', './all.js');

navigation.addEventListener('navigate', () => console.log('nav after'));

// navigation.navigate(location.href, { history: 'replace' });
