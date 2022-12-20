import schedule from './schedule.ts';
import render from './render.ts';
import Context from './context.ts';
import html from './html.ts';

export const MountCache = new WeakMap();

export default async function mount(root: Element, context: any, component: any) {
    const update = async function () {
        await schedule(root, renderInstance);
    };

    const contextInstance = Context(context(html), update);
    const renderInstance = render.bind(null, root, contextInstance, component);

    const cache = MountCache.get(root);

    if (cache && cache.disconnect) await cache.disconnect()?.catch?.(console.error);
    if (cache && cache.disconnected) await cache.disconnected()?.catch(console.error);

    MountCache.set(root, contextInstance);

    if (contextInstance.connect) await contextInstance.connect()?.catch?.(console.error);
    await update();
    // setTimeout(()=> update(), 1000);
    // setInterval(() => update(), 1000);
    if (contextInstance.connected) await contextInstance.connected()?.catch(console.error);

    return update;
}
