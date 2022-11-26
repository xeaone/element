import { ContextData, Items } from './types.ts';
import Virtual from './virtual.ts';
import Schedule from './schedule.ts';
import Context from './context.ts';
import Patch from './patch.ts';
import Cycle from './cycle.ts';

export default function Render(target: () => Element, context: () => ContextData, component: () => Items) {
    const update = async function () {
        await Schedule(() => Patch(target(), component()));
    };

    context = Context(context(), update);
    component = component.bind(null, Virtual, context);

    // await update();
    Patch(target(), component());
    Cycle(target(), context);

    return { context, component };
}
