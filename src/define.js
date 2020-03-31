import Component from './component.js';
import Importer from './importer.js';
import Class from './class.js';

export default function Define (name, constructor) {
    console.log(name);
    if (typeof constructor === 'string') {
        return Promise.resolve()
            .then(() => Importer(constructor))
            .then((data) => Define(name, data));
    } else if (typeof constructor === 'function') {
        window.customElements.define(name, constructor);
    } else if (constructor instanceof Array) {
        constructor.forEach(Define.bind(this, name));
    } else {
        Define(name, Class(Component, constructor));
    }
}
