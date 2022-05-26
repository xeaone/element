import XElement from './x-element.js';
import Highlight from './highlight.js';

export default class XRoot extends XElement {

    static observedProperties = [
        'example',
        // 'indexRoute',
        // 'indexJs',
        // 'indexHtml'
    ];

    constructor () {
        super();
        this.shadowRoot.innerHTML = '<slot></slot>';
        Highlight();
        document.body.style.opacity = 1;
    }

    example = /*js*/`
        import XElement from '/x-element.js';

        MyElement extends XElement {

            static observedProperties = ['greeting','greet']

            greeting: '',
            greet () { this.greeting = 'Hola Mundo'; }

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
            <h4>XElement's vision is to provide an agnostic non framework that enhances custom elements with functionality that mimics native custom element standards.</h4>

            <h2>Features</h2>
            <div class="tiles">
                <div class="tile">
                    <h4>&#128118; Simple</h4>
                    <span>Simple to learning and get started.</span>
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

    connectedCallback () {
        if (!this.innerHTML) this.innerHTML = this.#html;
    }

    // indexRoute = `
    // // routes/index.js
    // import XElement from '/x-element.js';

    // export default IndexRoute extends XElement {
    //     title = 'Index Route'
    //     description = 'Index Description'
    //     constructor () {
    //         super();
    //         this.shadowRoot.innerHTML = \`<h1>Hello World</h1>\`;
    //     }
    // }
    // `;

    // indexJs = `
    // // index.js
    // import XRouter from '/x-router.js';

    // await XRouter.setup({
    //     target: 'main',
    //     folder: 'routes'
    // });
    // `;

    // indexHtml = `
    // <!-- index.html -->
    // <html>
    // <head>
    //     \<script src="/index.js" defer\>\<\/script\>
    // </head>
    // <body>
    //     <main></main>
    // </body>
    // </html>
    // `;

}

// XIndex.define();