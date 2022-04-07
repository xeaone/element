import XElement from './x-element.js';

export default class XAll extends XElement {

    constructor () {
        super();
        this.shadowRoot.innerHTML = '<slot></slot>';
        // document.body.style.opacity = 1;
    }

    #html = /*html*/`
        <h1>404</h1>
        <h2>This page does not exists</h2>
    `;

    connectedCallback () {
        if (!this.innerHTML) this.innerHTML = this.#html;
    }

}
