import { router, component, html } from './x-element.js';

const main = document.querySelector('main');

// const comp = function (create, render) {
//     const data = {};
//     create(data);
//     return data.render = () => render(data);

// };


// const comp = function (create, render) {
//     return function decorator (Class) {
//         Class = Class ?? HTMLElement;

//         Class = class extends Class {
//             constructor () {
//                 super();

//                 const data = {};
//                 create(data);
//                 data.render = () => render(data);

//                 this.append(render(data));
//             }
//         };

//         // Class = (...args) => {
//         //     return new Class(...args);
//         // };

//         customElements.define('x-test', Class);

//         return Class;
//     };
// };

class test extends component {

    create = data => {
        data.num = 0;

    };

    render = data => {
        return html`
        <h1>${data.num++}</h1>
        ${html`<h2>${'foo'}</h2>`}
    `;
    };

}

test.define();

document.body.append(new test());

setTimeout(() => {

    document.body.append(document.createElement('x-test'));
}, 1000);



// router('/', main, () => import('./root.js'));
// router('/guide', main, () => import('./guide.js'));
// router('/guide/', main, () => import('./guide.js'));
// router('/security', main, () => import('./security.js'));
// router('/security/', main, () => import('./security.js'));
// router('/*', main, () => import('./all.js'));

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

// location.replace(location.href);
