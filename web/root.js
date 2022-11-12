import Highlight from './highlight.js';

const example = Highlight(`
    import XElement from '/x-element.js';

    MyElement extends XElement {

        greeting = '';
        greet () { this.greeting = 'Greeting'; }

        constructor () {
            super();
            this.greeting = 'Hello World';
            this.shadowRoot.innerHTML = \`
                <h1>{{title}}</h1 >
                <button onclick="{{greet()}}">Greet</button>;
            \`;
        }

    }

    MyElement.define();
`, 'js');

export const context = () => ({})

export const component = ({
    section, h2, h4, div, span, pre, code, a
}) => [
    section(

        h2('Vision'),
        h4('X-Element\'s vision is to provide an agnostic non framework that enhances custom elements with functionality and data binding that mimics native custom element standards.'),

        h2('Features'),
        div(
            div(
                h4('&#128118; Simple'),
                span('Simple to learning if you know custom elements you know XElement.'),
            ).class('tile'),
            div(
                h4('&#128230; Shareable'),
                span('A single class to build a single component or an entire app.'),
            ).class('tile'),
            div(
                h4('&#9889; Fast'),
                span('Tiny footprint ~15KB (minified and compressed).'),
            ).class('tile'),
            div(
                h4('&#127959; Framework Agnostic'),
                span('Use XElement with any framework - React, Vue, Angular...'),
            ).class('tile'),
            div(
                h4('&#129517; Client Side Routing'),
                span(
                    'Using the new',
                    a('Navigation API').href('https://developer.chrome.com/docs/web-platform/navigation-api/').target('_blank'),
                ),
            ).class('tile'),
        ).class('tiles'),

        h2('Example'),
        pre(code().class('language-js').html(example))
    )
]
