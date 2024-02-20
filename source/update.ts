import { BindersCache } from './global.ts';
import { action } from './action.ts';

let Next: Promise<void> | undefined;
let Current: Promise<void> | undefined;

// type UpdateTypeGlobal = 1;
// type UpdateTypeLocal = 2;
// type UpdateTypeQueue = 3;
// type UpdateType = UpdateTypeGlobal | UpdateTypeLocal | UpdateTypeQueue;

export const next = async function (): Promise<void> {
    await Current;
    await new Promise((resolve) => {
        queueMicrotask(async () => {
            Next = undefined;
            await update();
            resolve(undefined);
        });
    });
};

// export const update = async function (type?: UpdateType, binders?: Binder[]): Promise<void> {
export const update = async function (): Promise<void> {
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
