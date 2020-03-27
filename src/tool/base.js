
export default function Base () {
    const base = window.document.querySelector('base');
    if (base) return base.href;
    else return window.location.origin + (window.location.pathname ? window.location.pathname : '/');
}
