import { BindersCache } from './global';
import { action } from './action';

let Next: Promise<void> | undefined;
let Current: Promise<void> | undefined;

export const next = async function (): Promise<void> {
    console.log('next');
    await Current;
    await new Promise((resolve) => {
        queueMicrotask(async () => {
            Next = undefined;
            await update();
            resolve(undefined);
        });
    });
};

export const update = async function (): Promise<void> {
    console.log('update');
    if (Current) {
        if (Next) {
            await Next;
        } else {
            Next = next();
            await Next;
        }
    } else {
        Current = new Promise((resolve) => {
            queueMicrotask(async () => {
                const binders = BindersCache.values();

                for (const binder of binders) {
                    try {
                        await action(binder);
                    } catch (error) {
                        console.error(error);
                    }
                }

                Current = undefined;

                resolve();
            });
        });

        await Current;
    }
};

export const updateAllSync = function () {
    const binders = BindersCache.values();

    for (const binder of binders) {
        try {
            action(binder);
        } catch (error) {
            console.error(error);
        }
    }

}

// const stack: Binder[] = [];
// export const update = async function (binders?: Binder[]): Promise<void> {
//     if (binders && binders.length) {
//         stack.push(...binders);
//     }

//     if (Current) {
//         await Current;
//     } else {
//         Current = new Promise((resolve) => {
//             queueMicrotask(async () => {
//                 let binder: Binder | undefined = stack?.shift();

//                 while (binder) {
//                     try {
//                         await action(binder);
//                     } catch (error) {
//                         console.error(error);
//                     }

//                     binder = stack?.shift();
//                 }

//                 Current = undefined;

//                 resolve();
//             });
//         });

//         await Current;
//     }
// };
