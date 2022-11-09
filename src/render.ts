import { ContextData, Items } from './types.ts';
import Virtual from './virtual.ts';
import Schedule from './schedule.ts';
import Context from './context.ts';
import Patch from './patch.ts';

export default function Render(root: () => Element, context: () => ContextData, component: () => Items) {
    const update = function () {
        Schedule(() => Patch(root(), component()));
    };

    context = Context(context(), update);
    component = component.bind(null, Virtual, context);

    update();
}
