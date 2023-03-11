let busy = false;

const sleep = (time?: number) => new Promise((resolve) => setTimeout(resolve, time ?? 0));

const Actions: any = [];
const OldValues: any = [];
const NewValues: any = [];

export default async function schedule(actions: any[], oldValues: any[], newValues: any[]) {
    actions = actions ?? [];
    oldValues = oldValues ?? [];
    newValues = newValues ?? [];

    Actions.push(...actions);
    OldValues.push(...oldValues);
    NewValues.push(...newValues);

    if (busy) return;
    busy = true;

    let action;
    let oldValue;
    let newValue;
    let max = performance.now() + 50;

    while (Actions.length > 0) {
        if (
            (navigator as any).scheduling?.isInputPending() ||
            performance.now() >= max
        ) {
            await sleep();
            max = performance.now() + 50;
            continue;
        }

        action = Actions.shift();
        oldValue = OldValues.shift();
        newValue = NewValues.shift();

        if (oldValue !== newValue) {
            await action(oldValue, newValue);
        }
    }

    busy = false;
}
