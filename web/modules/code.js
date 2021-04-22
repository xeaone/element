
export default function Code (...args) {
    let [ cb ] = args.slice(-1);

    let data = args
        .slice(0, -1)
        .join('\n')
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
