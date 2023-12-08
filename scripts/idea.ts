import {
    parseHTML
} from 'https://esm.sh/linkedom@0.16.4?target=deno';

const window = parseHTML(``) as Window;
const document = window.document as Document;

let counter = -1;

type State = Record<any, any>;

interface Html {
    (s: State): DocumentFragment,

    template: HTMLTemplateElement,
    strings: TemplateStringsArray,
    update: () => void,
    variables: any[],
    id: number,
}

const Stated = Symbol('stated');

const Tags: WeakMap<TemplateStringsArray, Html> = new WeakMap();
const stateCache: WeakMap<any, Html> = new WeakMap();

// interface Html {
//     template: HTMLTemplateElement,
//     strings: TemplateStringsArray,
//     update: () => void,
//     variables: any[],
//     id: number,
// }

// const Tags: WeakMap<TemplateStringsArray, Html> = new WeakMap();

// const html = function (strings: TemplateStringsArray, ...variables: any[]): Html {
//     const tag = Tags.get(strings);

//     if (tag) {
//         tag.variables = variables;
//         return tag;
//     }

//     let innerHTML = '';
//     const id = ++counter;
//     const length = strings.length-1;

//     for (let index = 0; index < length; index++) {
//         innerHTML += `${strings[index]}x-${id}-${index}-x`;
//     }

//     innerHTML += strings[ length ];

//     const template = document.createElement('template');
//     // const startMarker = document.createTextNode('');
//     // const endMarker = document.createTextNode('');

//     template.innerHTML = innerHTML;
//     // template.content.prepend(startMarker);
//     // template.content.append(endMarker);

//     const node = template.content.querySelector('h1');
//     const variable = variables[ 0 ];

//     const update = () => {
//         if (node) node.textContent = variable;
//     };

//     const result = { template, update, strings, variables, id };

//     Tags.set(strings, result);

//     return result;
// };

// const x = function <S extends State> (
//     state: S,
//     render: (s: S) => Html
// ): DocumentFragment {

//     const { template, update } = render(state);

//     const values = {};
//     const names = Object.getOwnPropertyNames(state);
//     for (const name of names) {
//         const descriptor = Object.getOwnPropertyDescriptor(state, name);
//         if (!descriptor) continue;
//         if (!descriptor.configurable) continue;
//         if (typeof descriptor.value === 'function') descriptor.value = descriptor.value.bind(state);
//         if (typeof descriptor.get === 'function') descriptor.get = descriptor.get.bind(state);
//         if (typeof descriptor.set === 'function') descriptor.set = descriptor.set.bind(state);
//         Object.defineProperty(state, name, {
//             configurable: false,
//             enumerable: descriptor.enumerable,
//             // configurable: descriptor.configurable,
//             get() {
//                 return (values as any)[ name ];
//             },
//             set(value) {
//                 (values as any)[ name ] = value;
//                 console.log('update');
//             }
//         });
//     }

//     update();

//     return template.content;
// }

// const c1 = () => x({

//     count: 0

// }, s => html`

//     <h1>${s.count}</h1>

// `)

// const r = c1();
// document.append(r);
// console.log(document.toString());

const html = function (strings: TemplateStringsArray, ...variables: any[]) {

   const tag = Tags.get(strings);
    if (tag) {
        console.log('cache.id', tag.id);
        tag.variables = variables;
        return tag;
    }

    let innerHTML = '';
    const id = ++counter;
    const length = strings.length-1;

    for (let index = 0; index < length; index++) {
        innerHTML += `${strings[index]}x-${id}-${index}-x`;
    }

    innerHTML += strings[ length ];

    const template = document.createElement('template');
    template.innerHTML = innerHTML;

    const startMarker = document.createTextNode('START');
    template.content.append(startMarker);

    const endMarker = document.createTextNode('END');
    template.content.prepend(endMarker);

    const update = function () {
        const parent = startMarker.parentElement;
        console.log(parent);

        const h1 = template.content.querySelector('h1');
        const div = template.content.querySelector('div');
        if (h1) h1.textContent = variables[0];
        if (div) div.replaceChildren(variables[ 1 ].template.content);
        // console.log(variables[ 1 ].template.content.children.length);

        console.log('update.id', id);
    };

    const result = function (state: State): DocumentFragment {
        console.log('result.id', id);
        update();

        if (Stated in state) {
            console.log('stated.id', id);
            return template.content;
        }

        const values = {};
        const names = Object.getOwnPropertyNames(state);
        for (const name of names) {
            const descriptor = Object.getOwnPropertyDescriptor(state, name);
            if (!descriptor) continue;
            if (!descriptor.configurable) continue;
            if (typeof descriptor.value === 'function') descriptor.value = descriptor.value.bind(state);
            if (typeof descriptor.get === 'function') descriptor.get = descriptor.get.bind(state);
            if (typeof descriptor.set === 'function') descriptor.set = descriptor.set.bind(state);
            Object.defineProperty(state, name, {
                configurable: false,
                enumerable: descriptor.enumerable,
                // configurable: descriptor.configurable,
                get() {
                    return (values as any)[ name ];
                },
                set(value) {
                    (values as any)[ name ] = value;
                    update();
                }
            });
        }

        Object.defineProperty(state, Stated, {
            value: Stated,
            enumerable: false,
            configurable: false,
        });

        return template.content;
    };

    result.id = id;
    result.template = template;
    result.update = update;
    result.strings = strings;
    result.variables = variables;

    Tags.set(strings, result);

    return result;
};

const instance = (x = {

    count: 0

}) => () => html`

    <h1>${x.count}</h1>

`(x)

// @render(e => html`

//     <h1>${e.count}</h1>

// `(e))

// class XE extends HTMLElement {

// }

    // <div>
    //     ${html`<span>test</span>`}
    // </div>



// type H<T extends any> = T & {
//     (strings: TemplateStringsArray, ...variables: any[]): any,
// }

// const X = function <T extends any> (this:any, t: T): H<T> {
//     const f = function (strings: TemplateStringsArray, ...variables: any[]) {
//     };
//     Object.assign(this, t);
//     return Object.assign(f, t);
// }

// const c3 = (x = X({

//     count: 0

// }), html = x) => html`

//     <h1>${x.count}</h1>
//     <div>
//         ${html`<span>test</span>`}
//     </div>

// `

// const c4 = () => X({

//     count: 0

// }, x => x`

//     <h1>${x.count}</h1>
//     <div>
//         ${x`<span>test</span>`}
//     </div>

// `)


const r = instance();
const f = r();
document.append(f);
r()
console.log(document.toString());
// instance()
