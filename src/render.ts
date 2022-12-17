import patch from './patch.ts';
import html from './html.ts';

export default async function render(root: Element, context: any, component: any) {
    const template = component(html, context);

    // const template = document.createElement('template');
    // template.innerHTML = data;

    if (context.upgrade) await context.upgrade()?.catch?.(console.error);
    patch(root, template);
    // patch(root, template.content, bindings);
    if (context.upgraded) await context.upgraded()?.catch(console.error);
}
