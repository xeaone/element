// import { parseHTML } from '@linkedom';
import { parseHTML } from '@linkedom/worker';

import { build, stop } from '@esbuild';
import { resolve } from '@std/path';
import { assertEquals } from '@std/assert';

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

const { window, document } = parseHTML(`<html><head></head><body></body></html>`);
const { html, update } = new Function('window', 'document', `
    const {
        customElements,
        DocumentFragment, HTMLElement, Element, Node, Event
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

Deno.test('value', async () => {
    let value = '';
    html`<input value=${() => value}>`(document.body);

    await update();
    assertEquals(window.document.body.innerHTML, `<input value="">`);

    value = 'hello world';

    await update();
    assertEquals(window.document.body.innerHTML, `<input value="hello world">`);
});

Deno.test('click and text', async () => {
    let text = '';
    html`<h1 onclick=${() => text = 'hello world'}>${() => text}</h1>`(document.body);

    (document.body.firstElementChild as HTMLElement).click();

    await update();
    assertEquals(window.document.body.innerHTML, `<h1>hello world</h1>`);
});
