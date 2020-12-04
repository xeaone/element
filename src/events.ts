
export default function Events (target:Element, name:string, detail?:any, options?:any) {
    options = options || { detail: null };
    options.detail = detail === undefined ? null : detail;
    target.dispatchEvent(new window.CustomEvent(name, options));
}
