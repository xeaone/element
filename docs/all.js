import XElement from './x-element.js';

export default class XAll extends XElement {

    constructor () {
        super();
        this.shadowRoot.innerHTML = '<slot></slot>';
    }

    #html = /*html*/`
        <h1>404</h1>
        <h2>This page does not exists</h2>
    `;

    connectedCallback () {
        if (this.innerHTML) return;
        this.innerHTML = this.#html;
        document.body.style.opacity = 1;
    }

}
