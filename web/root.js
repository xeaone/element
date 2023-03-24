import { component, html } from './x-element.js';
import highlight from './modules/highlight.js';

const componentExample = highlight(/*js*/`
import { component, html } from '/x-element.js';

export default class greet extends component {

    greeting = 'Default Greeting';
    greet = () => this.greeting = 'Updated Greeting';

    render = () => html\`
        <h1>this.greeting</h1>
        <button onclick=\${this.greet}>Greet</button>
    \`;

}
`);

const routerExample = highlight(`
import { router } from '/x-element.js';

router('/', document.body, ()=> import('/greet.js'));
`);

export default class root extends component  {

    created() {
        this.querySelector('#router').innerHTML = routerExample;
        this.querySelector('#component').innerHTML = componentExample;
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
                <h4><span class="material-symbols-rounded">commit</span> Reactive</h4>
                <span>Efficient two way reactive databing by default.</span>
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

        <h3>With Custom Element</h3>
        <p>
            Use Template Literal with the <code>html</code> Template Tag to give your Custom Element HTML.
        </p>
        <ul>
            <li>Efficient Reactive Properties by default.</li>
        </ul>
        <pre id="component"></pre>

        <h3>Router</h3>
        <p>
            The last parameter accepts a <code>function</code> and expects a Custom Element <code>class</code> or a module with a <code>export default</code> which should also return a Custom Element <code>class</code>.
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