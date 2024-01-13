import { BindersCache } from './global';
import { action } from './action';

let Next: Promise<void> | undefined;
let Current: Promise<void> | undefined;

export const next = async function (): Promise<void> {
    await Current;
    await new Promise(resolve => {
        queueMicrotask(async () => {
            Next = undefined;
            await update();
            resolve(undefined);
        });
    });
};

export const update = async function (): Promise<void> {
    if (Current) {
        console.log('Is Current');
        if (Next) {
            console.log('Is Next');
            await Next;
        } else {
            console.log('Not Next');
            Next = next();
            await Next;
        }
    } else {

        // Current = (async () => {
        //     const binders = BindersCache.values();

        //     for (const binder of binders) {
        //         try {
        //             await action(binder);
        //         } catch (error) {
        //             console.error(error);
        //         }
        //     }

        //     // Next = undefined;
        //     Current = undefined;
        // })();

        Current = new Promise(resolve => {
            queueMicrotask(async () => {
                const binders = BindersCache.values();

                for (const binder of binders) {
                    try {
                        await action(binder);
                    } catch (error) {
                        console.error(error);
                    }
                }

                // Next = undefined;
                Current = undefined;

                resolve();
            });
        });

        await Current;
    }
};
