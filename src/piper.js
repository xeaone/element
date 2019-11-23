
export default function Piper (binder, data) {

    if (binder.type === 'on') {
        return data;
    }

    if (!binder.pipes.length) {
        return data;
    }

    const methods = binder.container.model;

    if (!methods) {
        return data;
    }

    binder.pipes.forEach(name => {
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
    });

    return data;
}
