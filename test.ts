import { assertEquals } from 'https://deno.land/std@0.152.0/testing/asserts.ts';
import { delay } from 'https://deno.land/std@0.152.0/async/delay.ts';
import { build, stop } from 'https://deno.land/x/esbuild@v0.15.5/mod.js';
// import { parseHTML } from 'https://esm.sh/linkedom@0.14.14';
import { parseHTML } from 'https://esm.sh/linkedom@0.14.16';

console.clear();

await build({
    bundle: true,
    format: 'esm',
    target: 'ES2022',
    treeShaking: true,
    platform: 'browser',
    globalName: 'XElement',
    tsconfig: './tsconfig.json',
    outfile: './tmp/x-element.js',
    entryPoints: ['src/element.ts'],
});

stop();
// await Deno.run({ cmd: [ 'npx', 'tsc' ] }).status();
// await Deno.run({ cmd: [ 'npx', 'rollup', 'tmp/element.js', '--file', 'tmp/x-element.js', '--format', 'esm' ] }).status();

const { window, document } = parseHTML(`<html><head></head><body></body></html>`) as any;

const file = await Deno.readTextFile('./tmp/x-element.js');

const XElement = new Function(
    'window',
    `const { Node, Text, Attr, Event, Element, document, ShadowRoot, HTMLElement, customElements, MutationObserver } = window;
    ${file.replace(/\s*export\s+{\s+XElement\s+as\s+default\s+};/, 'return XElement')}`,
)(window);

const Element = function (name: string, html: string, data: any) {
    class TestElement extends XElement {
        constructor() {
            super();
            for (const key in data) this[key] = data[key];
        }
        connectedCallback() {
            this.innerHTML = html;
            this.shadowRoot.innerHTML = '<slot></slot>';
            this.prepare();
        }
    }

    window.customElements.define(name, TestElement);
    const element = document.createElement(name);
    document.body.appendChild(element);
    document.toString();

    return element;
};

Deno.test('each-binder: overwrite array', async () => {
    const element = Element(
        'each-binder-overwrite',
        `<div each="{{[numbers,'number']}}"><div>{{number}}</div></div>`,
        { numbers: [1, 2] },
    );

    await delay(10);
    assertEquals(element.innerHTML, '<div each=""><div>1</div><div>2</div></div>');

    element.numbers = ['one', 'two'];

    await delay(10);
    assertEquals(element.innerHTML, '<div each=""><div>one</div><div>two</div></div>');
});

Deno.test('each-binder value-binder', async () => {
    const element = Element(
        'each-value-binder',
        `<select value="{{fruit=$value}}" each="{{[fruits,'f']}}"><option value="{{f}}">{{f}}</option></select>`,
        { fruit: 'Orange', fruits: ['Apple', 'Orange', 'Tomato'] },
    );

    await delay(10);
    assertEquals(
        element.innerHTML,
        '<select value="Orange" each=""><option value="Apple">Apple</option><option value="Orange">Orange</option><option value="Tomato">Tomato</option></select>',
    );
});

Deno.test('text-binder', async () => {
    const element = Element('text-binder', '{{text}}', { text: '' });

    await delay(10);
    assertEquals(element.innerHTML, '');

    element.text = 'hello world';

    await delay(10);
    assertEquals(element.innerHTML, 'hello world');
});

Deno.test('checked-binder', async () => {
    const element = Element('checked-binder', '<input checked="{{checked=$checked}}" type="checkbox">', { checked: false });

    await delay(10);
    assertEquals(element.innerHTML, '<input type="checkbox">');

    element.checked = true;

    await delay(10);
    assertEquals(element.innerHTML, '<input checked type="checkbox">');
});

Deno.test('radio-binder', async () => {
    const element = Element(
        'radio-binder',
        [
            `<input checked="{{radioOne=$checked}}" type="radio" name="radio" value="one">`,
            `<input checked="{{radioTwo=$checked}}" type="radio" name="radio" value="two">`,
        ].join(''),
        { radioOne: undefined, radioTwo: undefined },
    );

    await delay(10);
    assertEquals(
        element.innerHTML,
        [
            `<input type="radio" name="radio" value="one">`,
            `<input type="radio" name="radio" value="two">`,
        ].join(''),
    );

    element.radioOne = 'one';

    await delay(10);
    assertEquals(
        element.innerHTML,
        [
            `<input checked type="radio" name="radio" value="one">`,
            `<input type="radio" name="radio" value="two">`,
        ].join(''),
    );
});

Deno.test('value-binder', async () => {
    const element = Element('value-binder', '<input value="{{text=$value.toUpperCase()}}">', { text: '' });

    await delay(10);
    assertEquals(element.innerHTML, '<input value="">');

    element.text = 'hello world';

    await delay(10);
    assertEquals(element.innerHTML, '<input value="HELLO WORLD">');
});
