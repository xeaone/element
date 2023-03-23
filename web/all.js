import { component, html } from './x-element.js';

export default class all extends component {

    connected () { console.log('connected'); }

    render = () => html`
    <section>
        <h1>404</h1>
        <h2>Page Not Found</h2>
    </section>
    `;

}
