import render from './render.ts';

type Route = {
    path?: string;

    render?: any;
    context?: any;
    content?: any;
    construct?: any;

    name?: string;
    root: Element;
};

const alls: Array<Route> = [];
const routes: Array<Route> = [];

const transition = async function (route: Route) {
    // if (route.cache && route.instance) {
    //     if (route.instance instanceof Component || route.instance.prototype instanceof Component) {
    //         route.root.replaceChildren(route.instance);
    //         await route.instance[$].render();
    //     } else {
    //         await route.instance.render();
    //     }
    // }

    // if (route.component instanceof Component || route.component.prototype instanceof Component) {
    //     route.name = route.name ?? Dash(route.component.name);

    //     if (!/^\w+-\w+/.test(route.name)) route.name = `x-${route.name}`;

    //     if (!customElements.get(route.name)) customElements.define(route.name, route.component);
    //     await customElements.whenDefined(route.name);

    //     route.instance = document.createElement(route.name);
    //     route.root.replaceChildren(route.instance);
    //     route.instance[$].render();

    // }
    // if (route.render) {
    //     route.render();
    // } else {
    // route.render = await mount(route.root, route.context, route.content);
    // }
    await render(route.root, route.context, route.content);
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
        if (!route.root) continue;

        // const current = Reflect.get(route.root, 'xRouterCurrent');
        // if (current === route) continue;

        // const busy = Reflect.get(route.root, 'xRouterBusy');
        // if (busy) continue;

        // if (Reflect.get(route.root, 'xRouterPath') === route.path) continue;

        // const current = Reflect.get(route.root, 'xRouterCurrent');
        // if (current) current.instance.childNodes = Array.from(current.root.childNodes);

        // Reflect.set(route.root, 'xRouterBusy', true);
        Reflect.set(route.root, 'xRouterPath', route.path);
        transitions.push(route);
    }

    for (const all of alls) {
        if (!all.root) continue;
        let has = false;

        for (const transition of transitions) {
            if (transition.root === all.root) {
                has = true;
                break;
            }
        }

        if (has) continue;
        if (Reflect.get(all.root, 'xRouterPath') === pathname) continue;
        // if (all.root && Reflect.get(all.root, 'xRouterBusy')) continue;
        // if (all.root) Reflect.set(all.root, 'xRouterBusy', true);

        transitions.push(all);
    }

    // if (!transitions.length) return;

    if (event?.intercept) {
        return event.intercept({ handler: () => transitions.map((route) => transition(route)) });
    } else if (event?.transitionWhile) {
        return event.transitionWhile(transitions.map((route) => transition(route)));
    } else {
        transitions.map((route) => transition(route));
    }
};

const router = function (path: string, root: Element, context: any, content: any) {
    if (!path) throw new Error('XElement - router path required');
    if (!root) throw new Error('XElement - router root required');
    if (!context) throw new Error('XElement - router context required');
    if (!content) throw new Error('XElement - router content required');

    if (path === '/*') {
        for (const all of alls) {
            if (all.path === path && all.root === root) {
                throw new Error('XElement - router duplicate path on root');
            }
        }

        alls.push({ path, root, context, content });
    } else {
        for (const route of routes) {
            if (route.path === path && route.root === root) {
                throw new Error('XElement - router duplicate path on root');
            }
        }

        routes.push({ path, root, context, content });
    }

    Reflect.get(window, 'navigation').addEventListener('navigate', navigate);
};

export default router;
