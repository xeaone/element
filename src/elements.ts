import { AttributesSymbol, ChildrenSymbol, ElementSymbol, TypeSymbol } from './tool.ts';
// import { Item } from './types.ts';

export default new Proxy({}, {
    get(_, name) {
        return (attributes: any, ...children: any) => {
            if (attributes?.constructor !== Object || attributes?.[TypeSymbol] === ElementSymbol) {
                if (attributes !== undefined) {
                    children.unshift(attributes);
                }
                attributes = {};
            } else {
                attributes = attributes ?? {};
            }

            children[TypeSymbol] = ChildrenSymbol;
            attributes[TypeSymbol] = AttributesSymbol;

            return new Proxy({
                name,
                children,
                attributes,
                [TypeSymbol]: ElementSymbol,
            }, {
                get(target, key, receiver) {
                    if (typeof key === 'symbol') return Reflect.get(target, key, receiver);
                    if (key === 'name') return Reflect.get(target, key, receiver);
                    if (key === 'children') return Reflect.get(target, key, receiver);
                    if (key === 'attributes') return Reflect.get(target, key, receiver);
                    return (value: any) => {
                        Reflect.set(target.attributes, key, value);
                        return receiver;
                    };
                },
            });
        };
    },
});
