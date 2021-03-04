import { toDash } from './tool';
import Load from './load';

export default async function Define(component: any) {
    if (typeof component === 'string') {
        return Promise.resolve()
            .then(() => Load(component))
            .then(data => Define(data.default));
    } else if (component instanceof Array) {
        return Promise.all(component.map(data => Define(data)));
    } else {
        const name = toDash(component.name);
        window.customElements.define(name, component);
    }
}
