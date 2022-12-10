import render from './render.ts';
import html from './html.ts';

import Context from './context.ts';

export default function mount(root: Element, context: (html: any) => any, component: (html: any) => any) {
    const update = function () {
        console.log('update');
        renderInstance();
    };

    const contextInstance = Context(context(html), update);
    const renderInstance = render.bind(null, root, contextInstance, component);

    update();

    return update;
}
