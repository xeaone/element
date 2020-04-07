import Component from './component.js';
import Class from './class.js';
import Load from './load.js';

export default function Define (name, constructor) {
    if (!name) throw new Error('Oxe.define - name required');
    if (!name) throw new Error('Oxe.define - constructor required');
    if (typeof constructor === 'string') {
        return Promise.resolve()
            .then(() => Load(constructor))
            .then((data) => Define(name, data.default));
    } else if (typeof constructor === 'function') {
        window.customElements.define(name, constructor);
    } else if (constructor instanceof Array) {
        constructor.forEach(Define.bind(this, name));
    } else {
        Define(name, Class(Component, constructor));
    }
}
