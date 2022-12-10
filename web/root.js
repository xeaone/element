import Highlight from './modules/highlight.js';

const componentExample = Highlight(`
import { mount } from '/x-element.js';

const context = () => ({
    greeting: 'Default Greeting',
    greet() { this.greeting = 'Updated Greeting'; }
});

const component = (html, { greeting, greet }) => html\`
    <h1>greeting</h1>
    <button onclick=\${greet}>Greet</button>
\`;

const root = document.body;

mount(root, component, context);
`);

// import { Component } from '/x-element.js';

// export class MyGreeting extends Component {

//     static context = () => ({
//         greeting: 'Default Greeting',
//         greet() { this.greeting = 'Updated Greeting'; }
//     });

//     static component = (
//         { h1, button },
//         { greeting, greet }
//     ) => [
//         h1(greeting),
//         button('Greet').onclick(greet)
//     ];

// }

// MyGreeting.define();

// const target = document.querySelector('main');
// const instance = document.createElement('my-greeting');

// target.replaceChildren(instance);

const elementExample = Highlight(`
    Comming
`);

const routerExample = Highlight(`
import { router } from '/x-element.js';

const context = () => ({
    greeting: 'Default Greeting',
    greet() { this.greeting = 'Updated Greeting'; }
});

const component = (html, { greeting, greet }) => html\`
    <h1>greeting</h1>
    <button onclick=\${greet}>Greet</button>
\`;

const root = document.body;

router('/', root, context, component);
`);

export const context = () => ({});

export const component = (html) => html`
<section>

    <h2>Vision</h2>
    <h4>X-Element's vision is to provide an agnostic non framework that enhances custom elements with functionality and data binding that mimics native custom element standards.</h4>

    <h2>Features</h2>
    <div class="tiles">
        <div class="tile">
            <h4>\u{1F476} Simple</h4>
            <span>Simple to learning if you know custom elements you know XElement.</span>
        </div>
        <div class="tile">
            <h4>\u{1F4E6} Shareable</h4>
            <span>A single class to build a single component or an entire app.</span>
        </div>
        <div class="tile">
            <h4>\u{26A1} Fast</h4>
            <span>Tiny footprint ~15KB (minified and compressed).</span>
        </div>
        <div class="tile">
            <h4>\u{1F477} Framework Agnostic</h4>
            <span>Use XElement with any framework - React, Vue, Angular...</span>
        </div>
        <div class="tile">
            <h4>\u{1F9ED} Client Side Routing</h4>
            <span>
                Using the new
                <a href="https://developer.chrome.com/docs/web-platform/navigation-api/" target="_blank">Navigation API</a>
            </span>
        </div>
    </div>

    <h2>Component Example</h2>
    <pre>${componentExample}</pre>

    <h2>Element Example</h2>
    <pre>${elementExample}</pre>

    <h2>Router Example</h2>
    <pre>${routerExample}</pre>

</section>
`;