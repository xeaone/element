import Load from './load';

const toDash = (data: string) => data.replace(/[a-zA-Z][A-Z]/g, c => `${c[ 0 ]}-${c[ 1 ]}`.toLowerCase());

export default async function Define (component: any) {
    if (typeof component === 'string') {
        const loaded = await Load(component);
        return Define(loaded.default);
    } else if (component instanceof Array) {
        return Promise.all(component.map(data => Define(data)));
    } else {
        const name = toDash(component.name);
        window.customElements.define(name, component);
    }
}
