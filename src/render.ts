import { ContextType, Item } from './types.ts';
import Elements from './elements.ts';
import Schedule from './schedule.ts';
import Context from './context.ts';
import Patch from './patch.ts';

export default function Render(root: () => Element, context: () => ContextType, component: () => Array<Item>) {
    const update = function () {
        Schedule(() => Patch(root(), component()));
    };

    context = Context(context(), update);
    component = component.bind(null, Elements, context);

    update();
}
