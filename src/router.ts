import { replaceChildren  } from './poly';

type Module = { default: CustomElementConstructor }
type Handler = () => Module | CustomElementConstructor | Promise<CustomElementConstructor | Module>;

type Route = {
    path: string;
    instance: any;
    handler: Handler;
    container: Element;
};

const alls: Array<Route> = [];
const routes: Array<Route> = [];

const notModule = function (module:any) {
    return (!Object.keys(module).length) || (!!module.default && typeof module.default === 'object' && !Object.keys(module.default).length);
};

const transition = async function (route: Route) {
    if (route.instance) {
        replaceChildren(route.container, route.instance);
    } else {
        const tag = 'x-' + (route.path.replace(/\/+/g,'-').replace(/^-|-$|\.*/g, '') || 'root');
        const result = await route.handler() as any;
        const constructor = notModule(result) ? result : result.default;
        if (!customElements.get(tag)) {
            customElements.define(tag, constructor);
        }
        route.instance = document.createElement(tag);
        replaceChildren(route.container, route.instance);
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
            if (transition.container === all.container) {
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

const router = function (path: string, container: Element, handler: Handler) {
    if (!path) throw new Error('XElement - router path required');
    if (!handler) throw new Error('XElement - router handler required');
    if (!container) throw new Error('XElement - router container required');

    if (path === '/*') {
        for (const all of alls) {
            if (all.path === path && all.container === container) {
                throw new Error('XElement - router duplicate path on container');
            }
        }

        alls.push({ path, container, handler, instance: undefined });
    } else {
        for (const route of routes) {
            if (route.path === path && route.container === container) {
                throw new Error('XElement - router duplicate path on container');
            }
        }

        routes.push({ path, container, handler, instance: undefined });
    }

    Reflect.get(window, 'navigation').addEventListener('navigate', navigate);
};

export default router;
