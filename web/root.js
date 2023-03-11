import { component, html } from './x-element.js';
import Highlight from './modules/highlight.js';

const componentExample = Highlight(`
import { component, html } from '/x-element.js';

class XGreet extends HTMLElement {

    greeting = 'Default Greeting';
    greet() { this.greeting = 'Updated Greeting'; };

    template = () => html\`
        <h1>this.greeting</h1>
        <button onclick=\${this.greet}>Greet</button>
    \`;

}

export default component(XGreet);
`);

const routerExample = Highlight(`
import { router } from '/x-element.js';

router('/', container, () => import('/greet.js'));
`);

export default component(class XRoot extends HTMLElement {

    upgraded () {
        this.querySelector('#router').innerHTML = routerExample;
        this.querySelector('#component').innerHTML = componentExample;
    }

    template = () => html`
    <section>

        <h2>Vision</h2>
        <h4>X-Element's vision is to provide an agnostic non framework that enhances custom elements with functionality and data binding that mimics native custom element standards.</h4>

        <h3>Features</h3>
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

        <h3>Component</h3>
        <p>
            Pass a Custom Element Constructor to <code>component()</code> and it be decorated with XElement super powers.
            Use Template Literal with the <code>html</code> Template Tag to give your Custom Element HTML.
        </p>
        <pre id="component"></pre>

        <h3>Router</h3>
        <pre id="router"></pre>

    </section>
    `;

});