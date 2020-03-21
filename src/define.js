import Component from './component.js';
import Extend from './extend.js';

export default function define (name, constructor) {
    return window.customElements.define(name, Extend(constructor, Component));
}
