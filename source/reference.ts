
import { ReferenceType } from './types';

export const Reference = function <T>(data: any): ReferenceType<T> {
    return {
        data,
        get: function<T> (): T | undefined {
            if (this.data instanceof WeakRef) {
                return this.data.deref();
            } else {
                return this.data;
            }
        },
        set: function<T>(data: T): T | undefined {
            if (data instanceof Node) {
                this.data = new WeakRef(data);
                return data;
            } else {
                this.data = data;
                return data;
            }
        }
    };

};