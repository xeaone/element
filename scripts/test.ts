import { parseHTML } from '@linkedom/worker';
// import { DOMParser, DocumentFragment, Element, Node, } from '@b-fuze/deno-dom';

import { build, stop } from '@esbuild';
import { delay } from '@std/async/delay';
import { resolve } from '@std/path';
import { assertEquals } from '@std/assert';

// import tml, updateAllSync } from '../source/index.ts';

console.clear();

await build({
    bundle: true,
    format: 'iife',
    sourcemap: true,
    target: 'esnext',
    treeShaking: false,
    platform: 'browser',
    globalName: 'XElement',
    outfile: './tmp/x-element.js',
    entryPoints: ['source/index.ts'],
});

await stop();

const cwd = Deno.cwd();
const file = await Deno.readTextFile(resolve(cwd, 'tmp/x-element.js'));

// const document = new DOMParser().parseFromString('`<html><head></head><body></body></html>`', 'text/html');
// const { html, update, updateAllSync } = new Function('document', 'DocumentFragment', 'Element', 'Node', `
//     ${file}
//     return XElement;
// `)(document, DocumentFragment, Element, Node);

const { window, document } = parseHTML(`<html><head></head><body></body></html>`);
const { html, update, updateAllSync } = new Function('window', 'document', `
    const {
        customElements,
        DocumentFragment,
        HTMLElement, Element, Node, Event
    } = window;
    ${file}
    return XElement;
`)(window, document);

// Deno.test('each-binder: overwrite array', async () => {
//     const element = await Element(
//         'each-binder-overwrite',
//         `<div each="{{[numbers,'number']}}"><div>{{number}}</div></div>`,
//         { numbers: [ 1, 2 ] },
//     );

//     await delay(10);
//     assertEquals(element.innerHTML, '<div><div>1</div><div>2</div></div>');

//     element.numbers = [ 'one', 'two' ];

//     await delay(10);
//     assertEquals(element.innerHTML, '<div><div>one</div><div>two</div></div>');
// });

// Deno.test('each-binder value-binder', async () => {
//     const element = await Element(
//         'each-value-binder',
//         `<select value="{{fruit=$value??fruit}}" each="{{[fruits,'f']}}"><option value="{{f}}">{{f}}</option></select>`,
//         { fruit: 'Orange', fruits: [ 'Apple', 'Orange', 'Tomato' ] },
//     );

//     await delay(10);
//     assertEquals(
//         element.innerHTML,
//         '<select value="Orange"><option value="Apple">Apple</option><option value="Orange">Orange</option><option value="Tomato">Tomato</option></select>',
//     );
// });

// Deno.test('radio-binder', async () => {
//     const element = await Element(
//         'radio-binder',
//         [
//             `<input checked="{{radioOne=$checked??radioOne}}" type="radio" name="radio" value="one">`,
//             `<input checked="{{radioTwo=$checked??radioTwo}}" type="radio" name="radio" value="two">`,
//         ].join(''),
//         { radioOne: undefined, radioTwo: undefined },
//     );

//     await delay(10);
//     assertEquals(
//         element.innerHTML,
//         [
//             `<input type="radio" name="radio" value="one">`,
//             `<input type="radio" name="radio" value="two">`,
//         ].join(''),
//     );

//     element.radioOne = 'one';

//     await delay(10);
//     assertEquals(
//         element.innerHTML,
//         [
//             `<input checked type="radio" name="radio" value="one">`,
//             `<input type="radio" name="radio" value="two">`,
//         ].join(''),
//     );
// });

// Deno.test('map-binder', async () => {
//     const t = 'map-binder';
//     class c extends XElement.Component {
//         fruit = 'Orange';
//         fruits = ['Apple', 'Orange', 'Tomato'];
//         render = () => XElement.html`<select value=${this.fruit}>${this.fruits.map((fruit) => XElement.html`<option value=${fruit}>${fruit}</option>`)}</select>`;
//     }

//     window.customElements.define(t, c);
//     const e = window.document.createElement(t);
//     window.document.body.replaceChildren(e);

//     await delay(1);
//     assertEquals(window.document.body.innerHTML, `<${t}><select value="Orange"><option value="Apple">Apple</option><option value="Orange">Orange</option><option value="Tomato">Tomato</option></select></${t}>`);

//     e.fruit = 'Apple';

//     await delay(1);
//     assertEquals(window.document.body.innerHTML, `<${t}><select value="Apple"><option value="Apple">Apple</option><option value="Orange">Orange</option><option value="Tomato">Tomato</option></select></${t}>`);
// });

// Deno.test('checked-binder', async () => {
//     const t = 'checked-binder';
//     class c extends XElement.Component {
//         checked = false;
//         render = () => XElement.html`<input ${this.checked ? 'checked' : ''} type="checkbox">`;
//     }

//     window.customElements.define(t, c);
//     const e = window.document.createElement(t);
//     window.document.body.replaceChildren(e);

//     await delay(1);
//     assertEquals(window.document.body.innerHTML, `<${t}><input type="checkbox"></${t}>`);

//     e.checked = true;

//     await delay(1);
//     assertEquals(window.document.body.innerHTML, `<${t}><input checked type="checkbox"></${t}>`);
// });

// Deno.test('value-binder', async () => {
//     const t = 'value-binder';
//     class c extends XElement.Component {
//         value = '';
//         render = () => XElement.html`<input value=${this.value}>`;
//     }

//     window.customElements.define(t, c);
//     const e = window.document.createElement(t);
//     window.document.body.replaceChildren(e);

//     await delay(1);
//     assertEquals(window.document.body.innerHTML, `<${t}><input value=""></${t}>`);

//     e.value = 'hello world';

//     await delay(1);
//     assertEquals(window.document.body.innerHTML, `<${t}><input value="hello world"></${t}>`);
// });

// Deno.test('text-binder', async () => {
//     const t = 'text-binder';
//     class c extends XElement.Component {
//         text = '';
//         render = () => XElement.html`${this.text}`;
//     }

//     window.customElements.define(t, c);
//     const e = window.document.createElement(t);
//     window.document.body.replaceChildren(e);

//     await delay(1);
//     assertEquals(window.document.body.innerHTML, `<${t}></${t}>`);

//     e.text = 'hello world';

//     await delay(1);
//     assertEquals(window.document.body.innerHTML, `<${t}>hello world</${t}>`);
// });

// Deno.test('static create', async () => {
//     const t = 'x-c5';
//     class c5 extends XElement.Component {
//         text = '';
//         render = () => XElement.html`<h1>${this.text}</h1>`;
//     }

//     window.document.body.replaceChildren(c5.create());

//     await delay(1);
//     assertEquals(window.document.body.innerHTML, `<${t}><h1></h1></${t}>`);

//     window.document.querySelector(t).text = 'hello world';

//     await delay(1);
//     assertEquals(window.document.body.innerHTML, `<${t}><h1>hello world</h1></${t}>`);
// });

Deno.test('static upgrade', async () => {
    let text = '';

    html`<h1 onclick=${() => text = 'hello world'}>${() => text}</h1>`(document.body);

    await delay(100);
    assertEquals(document.body.innerHTML, `<h1></h1>`);

    // (document.body.firstElementChild as HTMLElement).click();

    text = 'hello world';
    updateAllSync();
    // await update();

    await delay(100);
    assertEquals(document.body.innerHTML, `<h1>hello world</h1>`);
});
