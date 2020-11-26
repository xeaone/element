
export default function Events (target, name, detail?, options?) {
    options = options || {};
    options.detail = detail === undefined ? null : detail;
    target.dispatchEvent(new window.CustomEvent(name, options));
}
