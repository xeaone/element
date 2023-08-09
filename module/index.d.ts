import Component from './component';
import Router from './router';
import html from './html';
export { Component };
export { Component as component };
export { Router };
export { Router as router };
export { html };
declare const _default: {
    Component: typeof Component;
    component: typeof Component;
    Router: (path: string, root: Element, handler: import("./types").Handler) => void;
    router: (path: string, root: Element, handler: import("./types").Handler) => void;
    html: typeof html;
};
export default _default;
