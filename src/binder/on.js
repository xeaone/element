// import Traverse from '../tool/traverse.js';
// import Binder from '../binder.js';

const on = async function (binder, event) {
    // const parameters = [];
    //
    // for (let i = 0, l = binder.pipes.length; i < l; i++) {
    //     const path = binder.pipes[i];
    //     const parameter = Traverse(binder.container.model, path);
    //     parameters.push(parameter);
    // }
    //
    // parameters.push(event);

    // Promise.resolve(data.bind(binder.container).apply(null, parameters)).catch(console.error);

    const method = binder.data;
    if (typeof method === 'function') {
        await method.call(binder.container, event);
    }

};

export default function (binder) {
    const type = binder.names[1];

    binder.target[type] = null;

    if (typeof binder.data !== 'function') {
        console.warn(`Oxe - binder ${binder.name}="${binder.value}" invalid type function required`);
        return;
    }

    if (binder.meta.method) {
        binder.target.removeEventListener(type, binder.meta.method);
    }

    binder.meta.method = on.bind(this, binder);
    binder.target.addEventListener(type, binder.meta.method);
}
