import Dash from './dash';

const navigators = new Map();

const transition = async (options: any) => {
    if (options.cache && options.instance) return options.target.replaceChildren(options.instance);

    if (options.navigating) return;
    else options.navigating = true;

    options.construct = options.construct ?? (await import(options.file)).default;
    if (!options.construct?.prototype) throw new Error('XElement - navigation construct not valid');

    options.name = options.name ?? Dash(options.construct.name);

    if (!/^\w+-\w+/.test(options.name)) options.name = `x-${options.name}`;
    if (!customElements.get(options.name)) customElements.define(options.name, options.construct);

    options.instance = document.createElement(options.name);
    options.target.replaceChildren(options.instance);
    options.navigating = false;
};

const navigate = (event?: any) => {
    if (event && (!event?.canTransition || !event?.canIntercept)) return;
    const destination = new URL(event?.destination.url ?? location.href);
    const base = new URL(document.querySelector('base')?.href ?? location.origin);

    base.hash = '';
    base.search = '';
    destination.hash = '';
    destination.search = '';

    const pathname = destination.href.replace(base.href, '/');
    const options = navigators.get(pathname) ?? navigators.get('/*');

    if (!options) return;

    options.target = options.target ?? document.querySelector(options.query);
    if (!options.target) throw new Error('XElement - navigation target not found');

    if (options.instance === options.target.lastElementChild) return event?.preventDefault();

    return event ? event?.intercept({ handler: () => transition(options) }) : transition(options);
};

export default function navigation (path: string, file: string, options: any) {
    if (!path) throw new Error('XElement - navigation path required');
    if (!file) throw new Error('XElement - navigation file required');

    const base = new URL(document.querySelector('base')?.href ?? location.origin);

    base.hash = '';
    base.search = '';

    options = options ?? {};
    options.path = path;
    options.cache = options.cache ?? true;
    options.query = options.query ?? 'main';
    options.file = new URL(file, base.href).href;

    navigators.set(path, options);

    navigate();

    (window as any).navigation.addEventListener('navigate', navigate);
}