import Traverse from './tool/traverse';

export default function Piper (binder, data) {

    if (binder.type === 'on') {
        return data;
    }

    if (!binder.pipes.length) {
        return data;
    }

    // const source = binder.container.model;
    const source = binder.container.methods;

    if (!Object.keys(source).length) {
        return data;
    }

    for (let i = 0; i < binder.pipes.length; i++) {
        const path = binder.pipes[i];
        const method = Traverse(source, path);

        if (method instanceof Function) {
            data = method.call(binder.container, data);
        } else {
            console.warn(`Oxe.piper - pipe ${path} invalid`);
        }

    }

    return data;
}
