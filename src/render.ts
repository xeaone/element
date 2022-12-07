import { RenderCache } from './tool.ts';
import Virtual from './virtual.ts';
import Schedule from './schedule.ts';
import Context from './context.ts';
import Patch from './patch.ts';

type ContextType = (virtual: any) => Record<any, any>;
type ComponentType = (virtual: any, context: any) => Array<any>;

export default async function Render(target: Element, context: ContextType, component: ComponentType) {
    const instance: any = {};

    instance.update = async function () {
        if (instance.context.upgrade) await instance.context.upgrade()?.catch?.(console.error);
        Patch(target, instance.component());
        if (instance.context.upgraded) await instance.context.upgraded()?.catch(console.error);
    };

    instance.change = async function () {
        await Schedule(target, instance.update);
    };

    instance.context = Context(context(Virtual), instance.change);
    instance.component = component.bind(instance.context, Virtual, instance.context);

    instance.render = async function () {
        const cache = RenderCache.get(target);

        // if (cache && cache !== instance.context && cache.disconnect) await cache.disconnect()?.catch?.(console.error);
        // if (cache && cache !== instance.context && cache.disconnected) await cache.disconnected()?.catch(console.error);
        if (cache && cache.disconnect) await cache.disconnect()?.catch?.(console.error);
        if (cache && cache.disconnected) await cache.disconnected()?.catch(console.error);

        RenderCache.set(target, instance.context);

        if (instance.context.connect) await instance.context.connect()?.catch?.(console.error);
        await Schedule(target, instance.update);
        if (instance.context.connected) await instance.context.connected()?.catch(console.error);
    };

    await instance.render();

    return instance;
}
