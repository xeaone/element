import XElement from './x-element.js';

export default class XAll extends XElement {

    #setup = false;

    #html = /*html*/`
        <h1>404</h1>
        <h2>This page does not exists</h2>
    `;

    connectedCallback () {
        if (this.#setup) return;
        else this.#setup = true;
        this.shadowRoot.innerHTML = '<slot></slot>';
        this.innerHTML = this.#html;
    }

}
