let busy = false;

const sleep = () => new Promise((resolve) => setTimeout(resolve, 0));

// const tasks: any = [];
// export default async function schedule(target: Element, task: Task) {
//     tasks.push(task);
//     if (busy) return;
//     busy = true;

//     let max = performance.now() + 50;

//     while (tasks.length > 0) {
//         if (performance.now() >= max) {
//             await sleep();
//             max = performance.now() + 50;
//             continue;
//         }

//         const task = tasks.shift();

//         await task();
//     }

//     busy = false;
// }

const Actions:any = [];
const OldValues:any = [];
const NewValues:any = [];

export default async function schedule (actions: any[], oldValues: any[], newValues: any[]) {
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
    let max = performance.now() + 100;

    while (Actions.length > 0) {

        // if (
        //     // (navigator as any).scheduling?.isInputPending() ||
        //     performance.now() >= max
        // ) {
        //     await sleep();
        //     max = performance.now() + 100;
        //     continue;
        // }

        action = Actions.shift();
        oldValue = OldValues.shift();
        newValue = NewValues.shift();

        if (oldValue !== newValue) {
            // console.log(action, oldValue, newValue);
            action(oldValue, newValue);
        }

    }

    busy = false;
}
