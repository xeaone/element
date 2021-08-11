
const ignores = [
    // '$render', '$event', '$value', '$checked', '$form', '$e', '$v', '$c', '$f',
    'window', 'document', 'console', 'location', 'Math', 'Date', 'Number', 'Array', 'Object'
];

const contexter = function (data: object, dynamics?: object) {

    // dynamics = dynamics || {};
    // const context = new Proxy({}, {
    const context = new Proxy(dynamics || {}, {
        has (target, key) {
            if (typeof key !== 'string') return true;
            return ignores.includes(key) ? false : true;
        },
        set: (target, key, value) => {
            if (typeof key !== 'string') return true;
            if (key === '$render') {
                for (const k in value) {
                    const v = value[ k ];
                    target[ `$${k}` ] = v;
                    target[ `$${k[ 0 ]}` ] = v;
                }
            }
            // else if (key in dynamics) dynamics[ key ] = value;
            else if (key in target) target[ key ] = value;
            else data[ key ] = value;
            return true;
        },
        get: (target, key) => {
            if (typeof key !== 'string') return;
            if (key in target) return target[ key ];
            // if (key in dynamics) return dynamics[ key ];
            if (key in data) return data[ key ];
        }
    });

    return context;
};

export default contexter;