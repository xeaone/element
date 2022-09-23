import XElement from './x-element.js';
import Highlight from './highlight.js';

export default class XRoot extends XElement {

    #rendered = false;
    #highlighted = false;

    example = `
        import XElement from '/x-element.js';

        MyElement extends XElement {

            greeting: '',
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
    `;

    #html = /*html*/`
    <section>
        <h2>Vision</h2>
        <h4>X-Element's vision is to provide an agnostic non framework that enhances custom elements with functionality and data binding that mimics native custom element standards.</h4>

        <h2>Features</h2>
        <div class="tiles">
            <div class="tile">
                <h4>&#128118; Simple</h4>
                <span>Simple to learning if you know custom elements you know XElement.</span>
            </div>
            <div class="tile">
                <h4>&#128230; Shareable</h4>
                <span>A single class to build a single component or an entire app.</span>
            </div>
            <div class="tile">
                <h4>&#9889; Fast</h4>
                <span>Tiny footprint ~15KB (minified and compressed).</span>
            </div>
            <div class="tile">
                <h4>&#127959; Framework Agnostic</h4>
                <span>Use XElement with any framework - React, Vue, Angular...</span>
            </div>
        </div>

        <h2>Example</h2>
        <pre><code class="language-js">{{example}}</code></pre>
    </section>
    `;

    async connectedCallback() {
        if (!this.#rendered && (this.#rendered = true)) this.innerHTML = this.#html;
        await super.connectedCallback();
        this.shadowRoot.innerHTML = '<slot></slot>';
        if (!this.#highlighted && (this.#highlighted = true)) Highlight();
    }

    async disconnectedCallback() {
        this.shadowRoot.innerHTML = '';
        await super.disconnectedCallback();
    }

}

// XRoot.define();