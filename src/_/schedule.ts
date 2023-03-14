let task:any = undefined;

const sleep = (time?: number) => new Promise((resolve) => setTimeout(resolve, time ?? 0));

const Actions: any = [];
const OldExpressions: any = [];
const NewExpressions: any = [];

export default function schedule(actions: any[], oldExpressions: any[], newExpressions: any[]): Promise<void> {
    // actions = actions ?? [];
    // oldExpressions = oldExpressions ?? [];
    // newExpressions = newExpressions ?? [];

    Actions.push(...actions);
    OldExpressions.push(...oldExpressions);
    NewExpressions.push(...newExpressions);

    if (task) return task;
    // task = true;

    task = (async () => {
        let action;
        let oldValue;
        let newValue;
        let max = performance.now() + 50;

        while (Actions.length > 0) {
            if (
                (navigator as any).scheduling?.isInputPending()
                // ||
                // performance.now() >= max
            ) {
                await sleep(10);
                // max = performance.now() + 50;
                continue;
            }

            action = Actions.shift();
            oldValue = OldExpressions.shift();
            newValue = NewExpressions.shift();

            if (oldValue !== newValue) {
                await action(oldValue, newValue);
            }
        }

        task = undefined;
    })();

    return task;

    // await future;

    // busy = false;
}
