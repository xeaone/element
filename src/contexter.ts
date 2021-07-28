
const contexter = function (data: object, dynamics?: object) {

    dynamics = dynamics || {};
    const $render = {};
    const context = new Proxy({}, {
        has: () => true,
        set: (target, key, value) => {
            if (typeof key !== 'string') return true;
            if (key === '$render') {
                for (const k in value) {
                    const v = value[ k ];
                    $render[ `$${k}` ] = v;
                    $render[ `$${k[ 0 ]}` ] = v;
                }
            }
            else if (key in dynamics) dynamics[ key ] = value;
            else data[ key ] = value;
            return true;
        },
        get: (target, key) => {
            if (typeof key !== 'string') return;
            if (key in $render) return $render[ key ];
            if (key in dynamics) return dynamics[ key ];
            if (key in data) return data[ key ];
            if (key in window) return window[ key ];
            return undefined;
        }
    });

    return context;
};

export default contexter;