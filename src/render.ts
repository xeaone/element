import virtual from './virtual.ts';
import patch from './patch.ts';
import html from './html.ts';

export default async function render(root: Element, context: any, component: any) {
    const componentInstance = component(html, context);
    const { data, properties } = componentInstance;
    const virtualInstance = virtual(data);

    // const template = document.createElement('template');
    // template.innerHTML = data;
    // patch(root, template.content, bindings);

    if (context.upgrade) await context.upgrade()?.catch?.(console.error);
    patch(root, virtualInstance, properties);
    if (context.upgraded) await context.upgraded()?.catch(console.error);
}
