
export default function Escape (...args) {
    return args.join('')
        // .replace(/^\t+/gm, '')
        // .replace(/^\s+/gm, '')

        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\//g, '&#x2F;')
        .replace(/`/g, '&#x60;')
        .replace(/=/g, '&#x3D;')
        .replace(/\{\{/g, '{&zwnj;{')
        .replace(/\}\}/g, '}&zwnj;}');
}
