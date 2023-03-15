import { component, html } from './x-element.js';
import highlight from './modules/highlight.js';

const withoutCustomElement = highlight(`

export const state = ({ html, c }) => ({
    greeting: 'Default Greeting',
    greet() { c.greeting = 'Updated Greeting'; }
});

export const template = ({ html, c }) => html\`
    <h1>c.greeting</h1>
    <button onclick=\${c.greet}>Greet</button>
\`;

`);

const withCustomElement = highlight(`
import { component, html } from '/x-element.js';

class XGreet extends HTMLElement {

    state = ({ s }) => ({
        greeting = 'Default Greeting';
        greet() { s.greeting = 'Updated Greeting'; };
    });

    template = ({ s }) => html\`
        <h1>s.greeting</h1>
        <button onclick=\${s.greet}>Greet</button>
    \`;

}

export default component(XGreet);
`);

const routerExample = highlight(`
import { router } from '/x-element.js';

router('/', document.body, ()=> import('/greet.js'));
`);

const state = ({ root }) => ({

    upgraded () {
        root.querySelector('#router').innerHTML = routerExample;
        root.querySelector('#withoutCustomElement').innerHTML = withoutCustomElement;
        root.querySelector('#withCustomElement').innerHTML = withCustomElement;
    }

});

const content = () => html`
    <section>

        <h2>Vision</h2>
        <h4>Provide an agnostic non framework that enhances custom elements with functionality and data binding that mimics native custom element standards.</h4>

        <h3>Features</h3>
        <div class="tiles">
            <div class="tile">
                <h4>\u{1F476} Simple</h4>
                <span>If you know HTML, JS, and Custom Elements then you know X-Element.</span>
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
            <div class="tile">
                <h4>\u{26A1} Data Binding</h4>
                <span>Efficient two way databing be default.</span>
            </div>
            <div class="tile">
                <h4>\u{1F4E6} Small</h4>
                <span>Tiny footprint ~15KB (minified and compressed).</span>
            </div>
        </div>

        <h3>Without Custom Element</h3>
        <p>
            If you don't need ShadowDOM then you could use this approach to create entire apps and components.
        </p>
        <ul>
            <li>There are NO global or module depencency required.</li>
        </ul>
        <pre id="withoutCustomElement"></pre>

        <h3>With Custom Element</h3>
        <p>
            Pass a Custom Element Constructor to <code>component()</code> and it is decorated with XElement super powers.
            Use Template Literal with the <code>html</code> Template Tag to give your Custom Element HTML.
        </p>
        <pre id="withCustomElement"></pre>

        <h3>Router</h3>
        <p>
            The last parameter takes a <code>function</code> and expects it to retrun any Custom Element <code>class</code> or a module with a <code>export default</code> which should also return any Custom Element <code>class</code>.
        </p>
        <pre id="router"></pre>

    </section>
`;

class XRoot extends HTMLElement {
    static define = true;
    state = state;
    content = content;
}

export default component(XRoot);