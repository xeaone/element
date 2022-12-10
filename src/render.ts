// import { RenderCache } from './tool.ts';
// import Virtual from './virtual.ts';
// import Schedule from './schedule.ts';
// import Context from './context.ts';
import patch from './patch.ts';
import html from './html.ts';

// type ContextType = (virtual: any) => Record<any, any>;
// type ComponentType = (virtual: any, context: any) => Array<any>;

// export default async function Render(target: Element, component: ComponentType, context: ContextType) {
//     const instance: any = {};

//     instance.update = async function () {
//         if (instance.context.upgrade) await instance.context.upgrade()?.catch?.(console.error);
//         Patch(target, instance.component());
//         if (instance.context.upgraded) await instance.context.upgraded()?.catch(console.error);
//     };

//     instance.change = async function () {
//         await Schedule(target, instance.update);
//     };

//     instance.context = Context(context(Virtual), instance.change);
//     instance.component = component.bind(instance.context, Virtual, instance.context);

//     instance.render = async function () {
//         const cache = RenderCache.get(target);

//         // if (cache && cache !== instance.context && cache.disconnect) await cache.disconnect()?.catch?.(console.error);
//         // if (cache && cache !== instance.context && cache.disconnected) await cache.disconnected()?.catch(console.error);
//         if (cache && cache.disconnect) await cache.disconnect()?.catch?.(console.error);
//         if (cache && cache.disconnected) await cache.disconnected()?.catch(console.error);

//         RenderCache.set(target, instance.context);

//         if (instance.context.connect) await instance.context.connect()?.catch?.(console.error);
//         await Schedule(target, instance.update);
//         if (instance.context.connected) await instance.context.connected()?.catch(console.error);
//     };

//     await instance.render();

//     return instance;
// }

export default function render(root: Element, context: any, component: any) {
    const componentInstance = component(html, context);
    const { data, bindings } = componentInstance;
    const template = document.createElement('template');

    template.innerHTML = data;

    // const script = document.createElement('script');
    // script.textContent = `console.log(document.currentScript.parentElement)`;
    // template.content.appendChild(script);

    for (const id in bindings) {
        const binding = bindings[id];
        const element = template.content.querySelector(`[data-x-${binding.id}]`);

        if (!element) throw new Error('query not found');

        if (binding.name.startsWith('on')) {
            element.addEventListener(binding.name.slice(2), binding.value.bind(context));
        }

        element.removeAttribute(`data-x-${binding.id}`);
    }

    patch(root, template.content);
}
