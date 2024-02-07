import highlight from './modules/highlight.js';
import { html, define } from '../source/index';

let count = 0;
const result = () => html`
    <strong>${() => `Hello World ${count}`}</strong>
    <button onclick=${() => count++}>Greet</button>
`;

const source = highlight(`
import { html } from '/x-element.js';

let count = 0;
export default ${result.toString()}(document.body);
`, 'js');

class Component extends HTMLElement {
    #root = this.attachShadow({ mode: 'open' });

    #count = 0;
    #render = () => html`
        <strong>${() => `Hello World ${this.#count}`}</strong>
        <button onclick=${() => this.#count++}>Greet</button>
    `(this.#root);

    constructor() {
        super();
        this.#render();
    }
};
define('x-component')(Component);

const sourceComponent = highlight(`
import { html } from '/x-element.js';

export default ${Component.toString()}
`, 'js');

export default html`

    <section>

        <h2>Vision</h2>
        <h4>Provide a zero knowledge agnostic non framework with data binding that mimics native HTML and JS standards.</h4>

        <div class="tiles">
            <div class="tile">
                <h4><span class="material-symbols-rounded">child_care</span> Simple</h4>
                <span>If you know HTML, JS, and Template Literals then you know how to use X-Element.</span>
            </div>
            <div class="tile">
                <h4><span class="material-symbols-rounded">magic_exchange</span> Agnostic</h4>
                <span>Use XElement with any framework or library - Lit, Vue, React, Angular...</span>
            </div>
            <div class="tile">
                <h4><span class="material-symbols-rounded">commit</span> Reactive</h4>
                <span>Efficient two way reactive databinding.</span>
            </div>
            <div class="tile">
                <h4><span class="material-symbols-rounded">bolt</span> Fast</h4>
                <span>Rendering is blazing fast, because XElement only interacts with the dynamic DOM Nodes.</span>
            </div>
            <div class="tile">
                <h4><span class="material-symbols-rounded">deployed_code</span> Small</h4>
                <span>~(15)KB minified.</span>
            </div>
            <div class="tile">
                <h4><span class="material-symbols-rounded">explore</span> Router</h4>
                <span>
                    Client side routing using the new
                    <a href="https://developer.chrome.com/docs/web-platform/navigation-api/" target="_blank">Navigation API</a>
                </span>
            </div>
        </div>

        <h3>Example</h3>
        <p>
            Use a tagged Template and invoke it with an Element paramater to render and mount.
            Alternatively use the tagged Template without invoking and use the returned DocumentFragment.
        </p>
        <pre>${source}</pre>
        <pre>${result()}</pre>

        <h3>Component Example</h3>
        <pre>${sourceComponent}</pre>
        <pre>${new Component()}</pre>

    </section>

`('main');

// const sourceComponent = highlight(`
// import { html } from '/x-element.js';

// export default class component {
//     #count = 0;
//     #root = this.attachShadow({ mode: 'open' });
//     #fragment = html\`
//         <strong>\${() => \`Hello World \${this.#count}\`}</strong>
//         <button onclick=\${() => this.#count++}>Greet</button>
//     \`(this.#root);
// }
// `, 'js');
