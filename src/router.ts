import { replaceChildren } from './poly';
import mount from './mount';

type Module = { default: CustomElementConstructor }
type Handler = () => Module | CustomElementConstructor | Promise<CustomElementConstructor | Module>;

type Route = {
    path: string;
    instance: any;
    handler: Handler;
    root: Element;
};

const alls: Array<Route> = [];
const routes: Array<Route> = [];

const notModule = function (module: any) {
    return (!Object.keys(module).length) || (!!module.default && typeof module.default === 'object' && !Object.keys(module.default).length);
};

const transition = async function (route: Route) {
    if (route.instance) {
        replaceChildren(route.root, route.instance);
    } else {
        const tag = 'x-' + (route.path.replace(/\/+/g, '-').replace(/^-|-$|\.*/g, '') || 'root');
        const result = await route.handler() as any;
        const data = notModule(result) ? result : result?.default ?? result;

        if (data?.prototype instanceof HTMLElement) {
            if (!customElements.get(tag)) {
                customElements.define(tag, data);
            }
            route.instance = document.createElement(tag);
            replaceChildren(route.root, route.instance);
        } else {
            // const options:any = { root: route.root };
            // if (data.state) options.state = data.state;
            // if (data.template) options.template = data.template;
            // else options.template = data;
            // await mount(options);
            await mount(route.root, data);
        }
    }
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
    const transitions: Array<Route> = [];

    for (const route of routes) {
        if (route.path !== pathname) continue;
        transitions.push(route);
    }

    for (const all of alls) {
        let has = false;

        for (const transition of transitions) {
            if (transition.root === all.root) {
                has = true;
                break;
            }
        }

        if (has) continue;

        transitions.push(all);
    }

    if (event?.intercept) {
        return event.intercept({ handler: () => transitions.map((route) => transition(route)) });
    } else if (event?.transitionWhile) {
        return event.transitionWhile(transitions.map((route) => transition(route)));
    } else {
        transitions.map((route) => transition(route));
    }
};

const router = function (path: string, root: Element, handler: Handler) {
    if (!path) throw new Error('XElement - router path required');
    if (!handler) throw new Error('XElement - router handler required');
    if (!root) throw new Error('XElement - router root required');

    if (path === '/*') {
        for (const all of alls) {
            if (all.path === path && all.root === root) {
                throw new Error('XElement - router duplicate path on root');
            }
        }

        alls.push({ path, root, handler, instance: undefined });
    } else {
        for (const route of routes) {
            if (route.path === path && route.root === root) {
                throw new Error('XElement - router duplicate path on root');
            }
        }

        routes.push({ path, root, handler, instance: undefined });
    }

    Reflect.get(window, 'navigation').addEventListener('navigate', navigate);
};

export default router;
