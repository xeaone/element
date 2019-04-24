
export default function (binder, data) {

    if (binder.type === 'on') {
        return data;
    }

    if (!binder.pipes.length) {
        return data;
    }

    const methods = binder.container.methods;

    if (!methods) {
        return data;
    }

    for (let i = 0, l = binder.pipes.length; i < l; i++) {
        const name = binder.pipes[i];

        if (name in methods) {
            const method = methods[name];
            if (method && method.constructor === Function) {
                data = methods[name].call(binder.container, data);
            } else {
                console.warn(`Oxe.piper - pipe ${name} invalid type`);
            }
        } else {
            console.warn(`Oxe.piper - pipe ${name} not found`);
        }

    }

    return data;
}
