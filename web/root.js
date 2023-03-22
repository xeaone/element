import { component, html } from './x-element.js';
import highlight from './modules/highlight.js';

const withoutCustomElement = highlight(`

export default (html, data) => (

    data.greeting = 'Default Greeting',
    data.greet = () => data.greeting = 'Updated Greeting',

    () => html\`
    <h1>data.greeting</h1>
    <button onclick=\${data.greet}>Greet</button>
\`);

`);

const withCustomElement = highlight(`
import { component, html } from '/x-element.js';

class XGreet extends HTMLElement {
    static shadow = false; // optional - creates and uses shadow root
    static define = false; // optional - customElements.defines the class with the tag option or class name
    static tag = 'x-greet'; // optional - defines a tag name

    construct = data => (

        data.greeting = 'Default Greeting',
        data.greet = () => data.greeting = 'Updated Greeting',

        () => html\`
        <h1>data.greeting</h1>
        <button onclick=\${data.greet}>Greet</button>
    \`)

}

export default component(XGreet);
`);

const routerExample = highlight(`
import { router } from '/x-element.js';

router('/', document.body, ()=> import('/greet.js'));
`);

export default class root extends component  {

    create = () => {
        this.querySelector('#router').innerHTML = routerExample;
        this.querySelector('#withoutCustomElement').innerHTML = withoutCustomElement;
        this.querySelector('#withCustomElement').innerHTML = withCustomElement;
    }

    render = () => html`

    <section>

        <h2>Vision</h2>
        <h4>Provide an agnostic non framework that enhances custom elements with functionality and data binding that mimics native custom element standards.</h4>

        <div class="tiles">
            <div class="tile">
                <h4><span class="material-symbols-rounded">child_care</span> Simple</h4>
                <span>If you know HTML, JS, and Template Literals then you know how to use X-Element.</span>
            </div>
            <div class="tile">
                <h4><span class="material-symbols-rounded">magic_exchange</span> Agnostic</h4>
                <span>Use XElement with any framework or library - React, Vue, Angular...</span>
            </div>
            <div class="tile">
                <h4><span class="material-symbols-rounded">explore</span> Routing</h4>
                <span>
                    Client side routing using the new
                    <a href="https://developer.chrome.com/docs/web-platform/navigation-api/" target="_blank">Navigation API</a>
                </span>
            </div>
            <div class="tile">
                <h4><span class="material-symbols-rounded">commit</span> Data Binding</h4>
                <span>Efficient two way databing by default.</span>
            </div>
            <div class="tile">
                <h4><span class="material-symbols-rounded">bolt</span> Fast</h4>
                <span>Rendering is blazing fast, because XElement only interacts with the dynamic DOM elemens of the UI.</span>
            </div>
            <div class="tile">
                <h4><span class="material-symbols-rounded">deployed_code</span> Small</h4>
                <span>Tiny footprint ~()KB (minified and compressed).</span>
            </div>
        </div>

        <h3>Without Custom Element</h3>
        <p>
            If you don't need ShadowDOM then you could use this fancy approach to create apps and components.
        </p>
        <ul>
            <li>No global or module depencency.</li>
            <li>No Custom Elements reducing unnecessary overhead.</li>
        </ul>
        <pre id="withoutCustomElement"></pre>

        <h3>With Custom Element</h3>
        <p>
            Pass a Custom Element Constructor to <code>component()</code> and it is decorated with XElement super powers.
            Use Template Literal with the <code>html</code> Template Tag to give your Custom Element HTML.
        </p>
        <ul>
            <li>Using the <code>component()</code> decorator instead of extending a class allows the ability to extend any Element type.</li>
        </ul>
        <pre id="withCustomElement"></pre>

        <h3>Router</h3>
        <p>
            The last parameter takes a <code>function</code> and expects it to retrun any Custom Element <code>class</code> or a module with a <code>export default</code> which should also return any Custom Element <code>class</code>.
        </p>
        <pre id="router"></pre>

    </section>

    `
}

// class XRoot extends HTMLElement {
//     static define = true;
//     state = state;
//     template = template;
// }

// export default component(XRoot);