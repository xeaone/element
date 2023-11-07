import { assertEquals } from 'https://deno.land/std@0.204.0/assert/mod.ts';


import { parseHTML } from 'https://esm.sh/linkedom';

const { document, customElements, HTMLElement } = parseHTML(`<!DOCTYPE html><html><head><title></title></head><body></body></html>`);

import parse from '../tmp/virtual/parse.ts';
import stringify from '../tmp/virtual/stringify.ts';
import { vCdata, vComment, vElement } from '../tmp/virtual/tool.ts';

// const json = function (data: any, format?: string) {
//     return JSON.stringify(data, (key, value) => key === 'parent' ? undefined : value, format);
// };

const ELEMENT_NODE = 1;
const ATTRIBUTE_NODE = 2;
const TEXT_NODE = 3;
const CDATA_SECTION_NODE = 4;
const COMMENT_NODE = 8;

Deno.test('voids', () => {
    const input = /*html*/`
    <area>
    <base>
    <br>
    <col>
    <command>
    <embed>
    <hr>
    <img>
    <input>
    <keygen>
    <link>
    <meta>
    <param>
    <source>
    <track>
    <wbr>
    `;
    const parsed = parse(input);
    // const children = parsed.children;

    const output = stringify(parsed);
    assertEquals(input, output);
});

// Deno.test('doctype', () => {
//     const input = /*html*/`<!DOCTYPE html>`;
//     const parsed = parse(input);
//     const children = parsed.children;
//     console.log(children[ 0 ]);
//     const output = stringify(parsed);
//     console.log(output);
//     assertEquals(input, output);
// });

Deno.test('textarea', () => {
    const input = /*html*/`<textarea><div>test</div></textarea>`;
    const parsed = parse(input);

    assertEquals(parsed.children.length, 1);
    assertEquals(parsed.children[ 0 ].name, 'textarea');
    assertEquals(parsed.children[ 0 ].type, ELEMENT_NODE);

    assertEquals((parsed.children[ 0 ] as any).children.length, 1);
    assertEquals((parsed.children[ 0 ] as any).children[ 0 ].name, '#text');
    assertEquals((parsed.children[ 0 ] as any).children[ 0 ].type, TEXT_NODE);

    const output = stringify(parsed);
    assertEquals(input, output);
});

Deno.test('script', () => {
    const input = /*html*/`<script>const v = '<html>In a string</html>';</script>`;
    const parsed = parse(input);

    assertEquals(parsed.children.length, 1);
    assertEquals(parsed.children[ 0 ].name, 'script');
    assertEquals(parsed.children[ 0 ].type, ELEMENT_NODE);

    assertEquals((parsed.children[ 0 ] as any).children.length, 1);
    assertEquals((parsed.children[ 0 ] as any).children[ 0 ].name, '#text');
    assertEquals((parsed.children[ 0 ] as any).children[ 0 ].type, TEXT_NODE);

    const output = stringify(parsed);
    assertEquals(input, output);
});

Deno.test('style', () => {
    const input = /*html*/`<style>body { background: blue; }</style>`;
    const parsed = parse(input);

    assertEquals(parsed.children.length, 1);
    assertEquals(parsed.children[ 0 ].name, 'style');
    assertEquals(parsed.children[ 0 ].type, ELEMENT_NODE);

    assertEquals((parsed.children[ 0 ] as any).children.length, 1);
    assertEquals((parsed.children[ 0 ] as any).children[ 0 ].name, '#text');
    assertEquals((parsed.children[ 0 ] as any).children[ 0 ].type, TEXT_NODE);

    const output = stringify(parsed);
    assertEquals(input, output);
});

Deno.test('comment', () => {
    const input = /*html*/`<!-- This should be <COMMENT>. -->`;
    const parsed = parse(input);

    const children = parsed.children;
    const child = parsed.children[ 0 ] as vComment;

    assertEquals(children.length, 1);
    assertEquals(child.name, '#comment');
    assertEquals(child.type, COMMENT_NODE);
    assertEquals(child.data, ' This should be <COMMENT>. ');

    const output = stringify(parsed);
    assertEquals(input, output);
});

Deno.test('cdata', () => {
    const input = /*html*/`<![CDATA[ This should be <CDATA>. ]]>`;
    const parsed = parse(input);

    const children = parsed.children;
    const child = parsed.children[ 0 ] as vCdata;

    assertEquals(children.length, 1);
    assertEquals(child.name, '#cdata-section');
    assertEquals(child.type, CDATA_SECTION_NODE);
    assertEquals(child.data, ' This should be <CDATA>. ');

    const output = stringify(parsed);
    assertEquals(input, output);
});

Deno.test('dynamic text', () => {
    const input = /*html*/`<div>Open {{in}} Close</div>`;
    const parsed = parse(input);

    assertEquals(parsed.children.length, 1);
    assertEquals(parsed.children[ 0 ].name, 'div');
    assertEquals(parsed.children[ 0 ].type, ELEMENT_NODE);

    assertEquals((parsed.children[ 0 ] as vElement).children.length, 3);
    assertEquals((parsed.children[ 0 ] as vElement).children[ 1 ].name, '#text');
    assertEquals((parsed.children[ 0 ] as vElement).children[ 1 ].type, TEXT_NODE);

    const output = stringify(parsed);
    assertEquals(input, output);
});

Deno.test('dynamic attribute name without value', () => {
    const input = /*html*/`<div {{attr}}></div>`;
    const parsed = parse(input);

    const children = parsed.children;
    const element = children[ 0 ] as vElement;
    assertEquals(children.length, 1);
    assertEquals(element.name, 'div');
    assertEquals(element.type, ELEMENT_NODE);
    assertEquals(element.children.length, 0);

    const attributes = element.attributes;
    const attribute = attributes[ 0 ];
    assertEquals(attributes.length, 1);
    assertEquals(attribute.value, '');
    assertEquals(attribute.name, '{{attr}}');
    assertEquals(attribute.type, ATTRIBUTE_NODE);

    const output = stringify(parsed);
    assertEquals(input, output);
});

Deno.test('dynamic attribute name with standard value quoted', () => {
    const input = /*html*/`<div {{attr}}="standard-value-quoted"></div>`;
    const parsed = parse(input);

    const children = parsed.children;
    const element = children[ 0 ] as vElement;
    assertEquals(children.length, 1);
    assertEquals(element.name, 'div');
    assertEquals(element.type, ELEMENT_NODE);
    assertEquals(element.children.length, 0);

    const attributes = element.attributes;
    const attribute = attributes[ 0 ];
    assertEquals(attributes.length, 1);
    assertEquals(attribute.value, 'standard-value-quoted');
    assertEquals(attribute.name, '{{attr}}');
    assertEquals(attribute.type, ATTRIBUTE_NODE);

    const output = stringify(parsed);
    assertEquals(input, output);
});

Deno.test('dynamic attribute name with dynamic value quoted', () => {
    const input = /*html*/`<div {{dyanmic-name}}="{{dynamic-value}}"></div>`;
    const parsed = parse(input);

    const children = parsed.children;
    const element = children[ 0 ] as vElement;
    assertEquals(children.length, 1);
    assertEquals(element.name, 'div');
    assertEquals(element.type, ELEMENT_NODE);
    assertEquals(element.children.length, 0);

    const attributes = element.attributes;
    const attribute = attributes[ 0 ];
    assertEquals(attributes.length, 1);
    assertEquals(attribute.value, '{{dynamic-value}}');
    assertEquals(attribute.name, '{{dyanmic-name}}');
    assertEquals(attribute.type, ATTRIBUTE_NODE);

    const output = stringify(parsed);
    assertEquals(input, output);
});

Deno.test('dynamic attribute name with dynamic value not quoted', () => {
    const input = /*html*/`<div {{dyanmic-name}}={{dynamic-value}}></div>`;
    const parsed = parse(input);

    const children = parsed.children;
    const element = children[ 0 ] as vElement;
    assertEquals(children.length, 1);
    assertEquals(element.name, 'div');
    assertEquals(element.type, ELEMENT_NODE);
    assertEquals(element.children.length, 0);

    const attributes = element.attributes;
    const attribute = attributes[ 0 ];
    assertEquals(attributes.length, 1);
    assertEquals(attribute.value, '{{dynamic-value}}');
    assertEquals(attribute.name, '{{dyanmic-name}}');
    assertEquals(attribute.type, ATTRIBUTE_NODE);

    const output = stringify(parsed);
    assertEquals(/*html*/`<div {{dyanmic-name}}="{{dynamic-value}}"></div>`, output);
});

Deno.test('decorator', () => {

    const html = (strings: TemplateStringsArray,  ...variabes: any[]) => {
        return strings.join('');
    };

    const state = Symbol('state');
    const render = Symbol('render');
    const define = (tag?: string) => (target: any, context?: ClassDecoratorContext) => {

        const init = () => customElements.define(tag ?? '', target);

        if (context !== undefined) {
            context.addInitializer(init);
        } else {
            init();
        }

        if (Reflect.has(target.prototype, state)) {
        }

        if (Reflect.has(target.prototype, render)) {
        }

        return target;
    };

    @define('x-test')
    class XTest extends HTMLElement {

        [state] (s, e) {
            s.title = 'hello world';
        }

        [render] = (s, e) => html`
        <div>${e.nodeName}</div>
        `

    }

});

//     <div attr4.1="{{attr4.2}} {{attr4.3}}"></div>
//     <{{tag}}></{{tag}}>

// const html = function (parts: TemplateStringsArray, ...variabes: any[]) {
//     return parts.map((part, index) => part += (variabes[ index ] ?? '')).join('');
// };

// const component = <C extends Record<any, any>, E extends HTMLElement> (
//     create: (element: E) => C,
//     render: (context: C) => string,
// ) => {

// };

// type Context = {
//     title: string,
// };
// // component<Context, HTMLElement>(
// component(e => ({

//     title: 'hello world'

// }), c => html`

//     <div>${c.title}</div>

// `);
