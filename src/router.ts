import Component from './component.ts';
import Render from './render.ts';
import Dash from './dash.ts';

type Options = {
    path?: string;
    cache?: boolean;
    query?: string;
    file?: string;

    context?: any;
    instance?: any;
    component?: any;
    construct?: any;

    name?: string;
    target?: Element;
    navigating?: boolean;
};

const navigators = new Map();

const transition = async function (options: Options) {
    if (!options.target) throw new Error('XElement - navigation target option required');

    if (options.navigating) return;
    else options.navigating = true;

    if (options.cache && options.instance) {
        if (options.instance instanceof Component) {
            options.navigating = false;
            return options.target.replaceChildren(options.instance);
        } else {
            options.navigating = false;
            return options.target.replaceChildren(...options.instance);
        }
    }

    // if (!options.file) throw new Error('XElement - navigation file option required');
    // options.construct = options.construct ?? (await import(options.file)).default;
    // if (!options.construct?.prototype) throw new Error('XElement - navigation construct not valid');

    if (options.component instanceof Component) {
        options.name = options.name ?? Dash(options.construct.name);

        if (!/^\w+-\w+/.test(options.name)) options.name = `x-${options.name}`;

        if (!customElements.get(options.name)) customElements.define(options.name, options.construct);
        await customElements.whenDefined(options.name);

        options.instance = document.createElement(options.name);
        options.target.replaceChildren(options.instance);
    } else {
        options.target.replaceChildren();
        Render(() => options.target as any, options.context, options.component);
        options.instance = Array.from(options.target.childNodes);
    }

    options.navigating = false;
};

const navigate = function (event?: any) {
    if (event && 'canIntercept' in event && event.canIntercept === false) return;
    if (event && 'canTransition' in event && event.canTransition === false) return;

    const destination = new URL(event?.destination.url ?? location.href);
    const base = new URL(document.querySelector('base')?.href ?? location.origin);

    base.hash = '';
    base.search = '';
    destination.hash = '';
    destination.search = '';

    const pathname = destination.href.replace(base.href, '/');
    const options = navigators.get(pathname) ?? navigators.get('/*');

    if (!options) return;

    if (event?.intercept) {
        return event.intercept({ handler: () => transition(options) });
    } else if (event?.transitionWhile) {
        return event.transitionWhile(transition(options));
    } else {
        transition(options);
    }
};

export default function router(path: string, target: Element, component: any, context: any, options: Options = {}) {
    if (!path) throw new Error('XElement - navigation path required');
    if (!target) throw new Error('XElement - navigation target required');

    const base = new URL(document.querySelector('base')?.href ?? location.origin);

    base.hash = '';
    base.search = '';

    options.path = path;
    options.target = target;
    options.cache = options.cache ?? true;

    // options.query = options.query ?? 'main';
    // options.file = new URL(file, base.href).href;

    if (!component) throw new Error('XElement - navigation component required');
    if (!(component instanceof Component) && !context) throw new Error('XElement - navigation context required');

    options.context = context;
    options.component = component;

    navigators.set(path, options);

    navigate();

    Reflect.get(window, 'navigation').addEventListener('navigate', navigate);
    // (window as any).navigation.addEventListener('navigate', navigate);
}

// const transition = async function (options: Options) {
//     if (!options.target) throw new Error('XElement - navigation target option required');
//     if (options.cache && options.instance) return options.target.replaceChildren(options.instance);

//     if (options.navigating) return;
//     else options.navigating = true;

//     if (!options.file) throw new Error('XElement - navigation file option required');
//     options.construct = options.construct ?? (await import(options.file)).default;
//     if (!options.construct?.prototype) throw new Error('XElement - navigation construct not valid');

//     options.name = options.name ?? Dash(options.construct.name);

//     if (!/^\w+-\w+/.test(options.name)) options.name = `x-${options.name}`;
//     if (!customElements.get(options.name)) customElements.define(options.name, options.construct);
//     await customElements.whenDefined(options.name);

//     options.instance = document.createElement(options.name);
//     options.target.replaceChildren(options.instance);
//     options.navigating = false;
// };

// const navigate = function (event?: any) {
//     if (event && ('canTransition' in event && !event.canTransition || 'canIntercept' in event && !event.canIntercept)) return;
//     const destination = new URL(event?.destination.url ?? location.href);
//     const base = new URL(document.querySelector('base')?.href ?? location.origin);

//     base.hash = '';
//     base.search = '';
//     destination.hash = '';
//     destination.search = '';

//     const pathname = destination.href.replace(base.href, '/');
//     const options = navigators.get(pathname) ?? navigators.get('/*');

//     if (!options) return;

//     options.target = options.target ?? document.querySelector(options.query);
//     if (!options.target) throw new Error('XElement - navigation target not found');

//     if (event?.intercept) {
//         if (options.instance === options.target.lastElementChild) return event.intercept();
//         return event.intercept({ handler: () => transition(options) });
//     } else if (event?.transitionWhile) {
//         if (options.instance === options.target.lastElementChild) return event.transitionWhile((() => undefined)());
//         return event.transitionWhile(transition(options));
//     } else {
//         transition(options);
//     }
// };

// export default function navigation(path: string, file: string, options: Options = {}) {
//     if (!path) throw new Error('XElement - navigation path required');
//     if (!file) throw new Error('XElement - navigation file required');

//     const base = new URL(document.querySelector('base')?.href ?? location.origin);

//     base.hash = '';
//     base.search = '';
//     options.path = path;
//     options.cache = options.cache ?? true;
//     options.query = options.query ?? 'main';
//     options.file = new URL(file, base.href).href;

//     navigators.set(path, options);

//     navigate();

//     Reflect.get(window, 'navigation').addEventListener('navigate', navigate);
//     // (window as any).navigation.addEventListener('navigate', navigate);
// }
