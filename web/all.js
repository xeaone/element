import { component, html } from './x-element.js';

export default component(class XAll extends HTMLElement {

    template = () => html`
        <section>
            <h1>404</h1>
            <h2>Page Not Found</h2>
        </section>
    `;

});
