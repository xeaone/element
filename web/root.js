import Highlight from './modules/highlight.js';

const virtualExample = Highlight(`
import { Render } from '/x-element.js';

const context = () => ({
    greeting: 'Default Greeting',
    greet() { this.greeting = 'Updated Greeting'; }
});

const component = (
    { h1, button },
    { greeting, greet }
) => [
    h1(greeting),
    button('Greet').onclick(greet)
];

const target = document.querySelector('main');

Render(target, context, component);
`);

const elementExample = Highlight(`
import { Component } from '/x-element.js';

export class MyGreeting extends Component {

    static context = () => ({
        greeting: 'Default Greeting',
        greet() { this.greeting = 'Updated Greeting'; }
    });

    static component = (
        { h1, button },
        { greeting, greet }
    ) => [
        h1(greeting),
        button('Greet').onclick(greet)
    ];

}

MyGreeting.define();

const target = document.querySelector('main');
const instance = document.createElement('my-greeting');

target.replaceChildren(instance);
`);

const routerExample = Highlight(`
import { Router } from '/x-element.js';

const context = () => ({
    greeting: 'Default Greeting',
    greet() { this.greeting = 'Updated Greeting'; }
});

const component = (
    { h1, button },
    { greeting, greet }
) => [
    h1(greeting),
    button('Greet').onclick(greet)
];

const target = document.querySelector('main');

Router('/', target, Root.context, Root.component);
`);

export const context = () => ({});

export const component = ({
    section, h2, h4, div, span, pre, code, a
}) => [
    section(

        h2('Vision'),
        h4('X-Element\'s vision is to provide an agnostic non framework that enhances custom elements with functionality and data binding that mimics native custom element standards.'),

        h2('Features'),
        div(
            div(
                h4('\u{1F476} Simple'),
                span('Simple to learning if you know custom elements you know XElement.'),
            ).class('tile'),
            div(
                h4('\u{1F4E6} Shareable'),
                span('A single class to build a single component or an entire app.'),
            ).class('tile'),
            div(
                h4('\u{26A1} Fast'),
                span('Tiny footprint ~15KB (minified and compressed).'),
            ).class('tile'),
            div(
                h4('\u{1F477} Framework Agnostic'),
                span('Use XElement with any framework - React, Vue, Angular...'),
            ).class('tile'),
            div(
                h4('\u{1F9ED} Client Side Routing'),
                span(
                    'Using the new ',
                    a('Navigation API').href('https://developer.chrome.com/docs/web-platform/navigation-api/').target('_blank'),
                ),
            ).class('tile'),
        ).class('tiles'),

        h2('Virtual Example'),
        pre(code().class('language-js').html(virtualExample)),

        h2('Element Example'),
        pre(code().class('language-js').html(elementExample)),

        h2('Router Example'),
        pre().html(routerExample),

    )
]
