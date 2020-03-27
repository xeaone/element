import Component from './component.js';
import Class from './class.js';

export default function Define (name, constructor) {
    if (constructor instanceof Function) {
        window.customElements.define(name, constructor);
    } else if (constructor instanceof Array) {
        constructor.forEach(Define.bind(this, name));
    } else {
        Define(name, Class(Component, constructor));
    }
}
