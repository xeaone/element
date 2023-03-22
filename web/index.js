import { router, component, html } from './x-element.js';

const main = document.querySelector('main');

// class test extends component {

//     create = data => {
//         data.num = 0;
//         data.value = 'Default';
//     };

//     render = data => html`
//         <div>${data.value}</div>
//         <input type="text" value=${data.value} oninput=${(e)=>data.value=e.target.value}>
//         ${html`<div>${'foo'}</div>`}
//     `;

// }

// test.define();

// document.body.append(new test());

// setTimeout(() => {

//     document.body.append(document.createElement('x-test'));
// }, 1000);

router('/', main, () => import('./root.js'));
router('/guide', main, () => import('./guide.js'));
router('/guide/', main, () => import('./guide.js'));
// router('/security', main, () => import('./security.js'));
// router('/security/', main, () => import('./security.js'));
router('/*', main, () => import('./all.js'));

// navigation.addEventListener('navigate', (event) => {

//     const handler = async () => {
//         const pathname = new URL(event?.destination.url ?? location.href).pathname;
//         let filename;

//         switch (pathname) {
//             case '/':
//                 filename = './root.js';
//                 break;
//             case '/guide':
//             case '/guide/':
//                 filename = './guide.js';
//                 break;
//             case '/security':
//             case '/security/':
//                 filename = './security.js';
//                 break;
//             default:
//                 filename = './all.js';
//         }

//         const module = (await import(filename)).default;

//         main.replaceChildren(await module.create())
//     };

//     if (event?.canIntercept) {
//         return event.intercept({ handler });
//     }

// });

location.replace(location.href);
