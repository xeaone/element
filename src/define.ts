import Component from './component';
import Class from './class';
import Load from './load';

export default async function Define (name, constructor) {
    if (!name) throw new Error('Oxe.define - name required');
    if (!name) throw new Error('Oxe.define - constructor required');
    if (typeof constructor === 'string') {
        return Promise.resolve()
            .then(() => Load(constructor))
            .then(data => Define(name, data.default));
    // } else if (typeof constructor === 'function') {
        // window.customElements.define(name, constructor);
    } else if (constructor instanceof Array) {
        constructor.forEach(Define.bind(this, name));
    } else {
        window.customElements.define(name, constructor);
        // Define(name, Class(Component, constructor));
    }
}
