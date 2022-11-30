import { ContextData, Items } from './types.ts';
import { Connect, Connected } from './cycle.ts';
import Virtual from './virtual.ts';
import Schedule from './schedule.ts';
import Context from './context.ts';
import Patch from './patch.ts';

export default function Render(target: () => Element, context: () => ContextData, component: () => Items) {
    const update = async function () {
        // await Schedule(() => Patch(target(), component()));
    };

    context = Context(context(), update);
    component = component.bind(null, Virtual, context);

    Connect(target(), context);
    Patch(target(), component());
    Connected(target(), context);

    return { context, component };
}
