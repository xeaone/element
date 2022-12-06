import { ContextData, Items } from './types.ts';
import { Connect, Connected, Upgrade, Upgraded } from './cycle.ts';
import Virtual from './virtual.ts';
import Schedule from './schedule.ts';
import Context from './context.ts';
import Patch from './patch.ts';

export default async function Render(target: () => Element, context: (virtual: any) => ContextData, component: (virtual: any, context: any) => Items) {
    const update = async function () {
        await Upgrade(target(), context);
        Patch(target(), component(Virtual, context));
        await Upgraded(target(), context);
    };

    const change = async function () {
        await Schedule(update, target());
    };

    context = Context(context(Virtual), change);

    await Connect(target(), context);
    await Schedule(update, target());
    // await Upgrade(target(), context);
    // Patch(target(), component(Virtual, context));
    // await Upgraded(target(), context);
    await Connected(target(), context);

    return { context, component };
}
