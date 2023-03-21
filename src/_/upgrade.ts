import { upgradingEvent, upgradedEvent } from './events';
import roots from './roots';

export type UpgradeOptions = {
    root: Element;
}

const upgrade = async function (options: UpgradeOptions) {
    const instance = roots.get(options.root);

    if (instance.busy) return;
    else instance.busy = true;

    instance.root.dispatchEvent(upgradingEvent);
    await instance.state?.upgrading?.()?.catch(console.error);

    const result = instance.template(instance);

    const length = instance.actions.length ?? 0;
    for (let index = 0; index < length; index++) {
        const newExpression = result.expressions[index];
        const oldExpressions = instance.expressions[index];
        instance.actions[index](oldExpressions, newExpression);
        instance.expressions[index] = newExpression;
    }

    // const task = schedule(instance.actions, instance.expressions, result.expressions);

    // instance.expressions.splice(0, -1, ...result.expressions);

    // await task;

    instance.busy = false;

    await instance.state?.upgraded?.()?.catch(console.error);
    instance.root.dispatchEvent(upgradedEvent);
};

export default upgrade;