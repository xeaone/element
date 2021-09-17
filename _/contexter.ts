
// const ignores = [
//     // '$render', '$event', '$value', '$checked', '$form', '$e', '$v', '$c', '$f',
//     'window', 'document', 'console', 'location', 'Math', 'Date', 'Number', 'Array', 'Object', 'Promise'
// ];

const contexter = function (data: object) {
    return new Proxy({},
        {
            has (target, key) {
                return true;
                // if (typeof key !== 'string') return true;
                // return ignores.includes(key) ? false : true;
            },
            set: (target, key, value) => {
                if (typeof key !== 'string') return true;
                if (
                    key === '$f' || key === '$form' ||
                    key === '$e' || key === '$event' ||
                    key === '$v' || key === '$value' ||
                    key === '$r' || key === '$render' ||
                    key === '$c' || key === '$checked'
                ) target[ key ] = value;
                else if (key in target) target[ key ] = value;
                else if (key in data) data[ key ] = value;
                // else data[ key ] = value;
                else window[ key ] = value;
                return true;
            },
            get: (target, key) => {
                if (typeof key !== 'string') return;
                if (key in target) return target[ key ];
                if (key in data) return data[ key ];
                // if (key in data) return data[ key ];
                return window[ key ];
            }
        }
    );
};

export default contexter;