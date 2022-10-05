import XElement from './x-element.js';

export default class XAll extends XElement {

    #html = /*html*/`
        <h1>404</h1>
        <h2>This page does not exists</h2>
    `;

    async connectedCallback() {
        if (!this.hasChildNodes()) this.innerHTML = this.#html;
        await super.connectedCallback();
        this.shadowRoot.innerHTML = '<slot></slot>';
    }

    async disconnectedCallback() {
        this.shadowRoot.innerHTML = '';
        await super.disconnectedCallback();
    }

}
