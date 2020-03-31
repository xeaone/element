
export default function Resolve () {

    const result = [];
    const origin = window.location.origin;
    const parser = window.document.createElement('a');

    for (let i = 0; i < arguments.length; i++) {
        const path = arguments[i];

        if (!path) continue;
        parser.href = path;

        if (parser.origin === origin) {
            if (path.indexOf(origin) === 0) {
                result.push(path.slice(origin.length));
            } else {
                result.push(path);
            }
        } else {
            return path;
        }

    }

    parser.href = result.join('/').replace(/\/+/g, '/');

    return parser;
    // return parser.pathname;
}
