import { assertEquals } from 'https://deno.land/std@0.152.0/testing/asserts.ts';
import { delay } from 'https://deno.land/std@0.152.0/async/delay.ts';
import { build, stop } from 'https://deno.land/x/esbuild@v0.15.5/mod.js';
import { parseHTML } from 'https://esm.sh/linkedom@0.14.12';

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
    entryPoints: [ 'src/element.ts' ],
});

stop();
// await Deno.run({ cmd: [ 'npx', 'tsc' ] }).status();
// await Deno.run({ cmd: [ 'npx', 'rollup', 'tmp/element.js', '--file', 'tmp/x-element.js', '--format', 'esm' ] }).status();

const { window, document } = parseHTML(`<html><head></head><body></body></html>`);

const file = await Deno.readTextFile('./tmp/x-element.js');

const XElement = new Function('window', `
    const { Node, Text, Attr, Event, Element, document, ShadowRoot, HTMLElement, customElements, MutationObserver } = window;
    ${file.replace(/\s*export\s+{\s+XElement\s+as\s+default\s+};/, 'return XElement')}
`)(window);

Deno.test('overwrite array with Each binder', async () => {
    class AE extends XElement {
        ns = [ 1, 2 ];
        connectedCallback () {
            this.shadowRoot.innerHTML = '<slot></slot>';
            this.innerHTML = `<div each="{{[ns,'n']}}"><div>{{n}}</div></div>`;
            this.prepare();
        }
    }

    AE.define();
    const ae = document.createElement('a-e') as any;
    document.body.appendChild(ae);
    document.toString();

    await delay(10);
    assertEquals(ae.innerHTML, '<div each=""><div>1</div><div>2</div></div>');

    ae.ns = [ 'one', 'two' ];

    await delay(10);
    assertEquals(ae.innerHTML, '<div each=""><div>one</div><div>two</div></div>');

});

Deno.test('select with Each and Value attributes', async () => {
    class SE extends XElement {
        fruit = 'Orange';
        fruits = [ 'Apple', 'Orange', 'Tomato' ];
        connectedCallback () {
            this.shadowRoot.innerHTML = '<slot></slot>';
            this.innerHTML = `<select value="{{fruit=$value}}" each="{{[fruits,'f']}}"><option value="{{f}}">{{f}}</option></select>`;
            this.prepare();
        }
    }

    SE.define();
    const se = document.createElement('s-e');
    document.body.appendChild(se);
    document.toString();

    await delay(10);
    assertEquals(se.innerHTML, '<select value="Orange" each=""><option value="Apple">Apple</option><option value="Orange">Orange</option><option value="Tomato">Tomato</option></select>');

});

// await delay(10);