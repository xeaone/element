import { assertEquals } from 'https://deno.land/std@0.152.0/testing/asserts.ts';
import { delay } from 'https://deno.land/std@0.152.0/async/delay.ts';

import { build, stop } from 'https://deno.land/x/esbuild@v0.15.5/mod.js';
import { JSDOM } from 'https://jspm.dev/jsdom@20.0.0';

console.clear();

await build({
    bundle: true,
    format: 'iife',
    globalName: 'XElement',
    target: 'es2020',
    treeShaking: true,
    platform: 'browser',
    tsconfig: './tsconfig.json',
    outfile: './tmp/x-element.js',
    entryPoints: [ 'src/element/element.ts' ],
});

stop();

const browser = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, { pretendToBeVisual: true });
const w = (browser as any).window;
const d = (browser as any).window.document;

const keys = [
    'Node',
    'Text',
    'Attr',
    'Event',
    'window',
    'Element',
    'document',
    'navigation',
    'HTMLElement',
    'CustomEvent',
    'customElements',
    // 'MutationObserver'
];

const values = keys.map((key) => w[ key ]);
const file = await Deno.readTextFile('./tmp/x-element.js');

const XElement = new Function(...keys, `
    class MutationObserver { observe() {} }
    ${file} return XElement.default;
`)(...values);

const frame = () => new Promise(w.requestAnimationFrame);

Deno.test('array', async () => {
    class AE extends XElement {
        ns = [ 1, 2 ];
        connectedCallback () {
            (this as any).shadowRoot.innerHTML = '<slot></slot>';
            (this as any).innerHTML = `<div each="{{[ns,'n']}}"><div>{{n}}</div></div>`;
            (this as any).prepare();
        }
    }

    AE.define();

    const ae = d.createElement('a-e');
    d.body.appendChild(ae);

    await frame();
    assertEquals(ae.outerHTML, '<a-e><div each=""><div>1</div><div>2</div></div></a-e>');

    ae.ns = [ 'one', 'two' ];

    await frame();
    assertEquals(ae.outerHTML, '<a-e><div each=""><div>one</div><div>two</div></div></a-e>');

    w.close();
});

await delay(10);