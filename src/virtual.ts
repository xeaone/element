import Dash from './dash.ts';
import { AttributesSymbol, CdataSymbol, ChildrenSymbol, CommentSymbol, ElementSymbol,  NameSymbol, TypeSymbol } from './tool.ts';

export default new Proxy({}, {
    get(eTarget, eName, eReceiver) {
        if (typeof eName === 'symbol') return Reflect.get(eTarget, eName, eReceiver);

        if (eName === 'comment') {
            return function CommentProxy(...value: any) {
                return { name: 'comment', value: value.join(''), [TypeSymbol]: CommentSymbol };
            };
        }

        if (eName === 'cdata') {
            return function CommentProxy(...value: any) {
                return { name: 'cdata', value: value.join(''), [TypeSymbol]: CdataSymbol };
            };
        }

        return function ElementProxy(attributes: any, ...children: any) {
            if (
                attributes?.[TypeSymbol] === CommentSymbol ||
                attributes?.[TypeSymbol] === ElementSymbol ||
                attributes?.[TypeSymbol] === CdataSymbol ||
                attributes?.constructor !== Object
            ) {
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
                children,
                attributes,
                [TypeSymbol]: ElementSymbol,
                [NameSymbol]: Dash(eName as string),
            }, {
                get(aTarget, aName, aReceiver) {
                    if (typeof aName === 'symbol') return Reflect.get(aTarget, aName, aReceiver);
                    if (aName === 'children') return Reflect.get(aTarget, aName, aReceiver);
                    if (aName === 'attributes') return Reflect.get(aTarget, aName, aReceiver);
                    return function AttributeProxy(aValue: any) {
                        Reflect.set(aTarget.attributes, aName, aValue);
                        return aReceiver;
                    };
                },
            });
        };
    },
});
