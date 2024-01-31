export default function Code(...args) {
    let data;
    let [cb] = args.slice(-1);

    if (typeof cb === 'boolean') {
        data = args.slice(0, -1).join('\n');
    } else {
        data = args.join('\n');
    }

    data = data
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\//g, '&#x2F;')
        .replace(/`/g, '&#x60;')
        .replace(/=/g, '&#x3D;');

    if (typeof cb === 'boolean' && cb === true) {
        data = data
            .replace(/\{\{/g, '{&zwnj;{')
            .replace(/\}\}/g, '}&zwnj;}');
    }

    return data;
}
