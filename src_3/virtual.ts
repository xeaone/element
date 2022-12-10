import Dash from './dash.ts';
import { AttributesSymbol, CdataSymbol, ChildrenSymbol, CommentSymbol, ElementSymbol, NameSymbol, ParametersSymbol, TypeSymbol } from './tool.ts';

const Virtual = new Proxy({}, {
    get(eTarget, eName, eReceiver) {
        if (typeof eName === 'symbol') return Reflect.get(eTarget, eName, eReceiver);

        if (eName === 'comment') {
            return function CommentProxy(...value: any) {
                return { name: eName, value: value.join(''), [TypeSymbol]: CommentSymbol };
            };
        }

        if (eName === 'cdata') {
            return function CdataProxy(...value: any) {
                return { name: eName, value: value.join(''), [TypeSymbol]: CdataSymbol };
            };
        }

        return function ElementProxy(...children: any) {
            return new Proxy({
                [AttributesSymbol]: {},
                [ParametersSymbol]: {},
                [ChildrenSymbol]: children,
                [TypeSymbol]: ElementSymbol,
                [NameSymbol]: Dash(eName as string).toUpperCase(),
            }, {
                get(aTarget, aName, aReceiver) {
                    if (typeof aName === 'symbol') return Reflect.get(aTarget, aName, aReceiver);
                    return function AttributeProxy(aValue: any, ...aParameters: any) {
                        Reflect.set(aTarget[AttributesSymbol], aName, aValue);
                        Reflect.set(aTarget[ParametersSymbol], aName, aParameters);
                        return aReceiver;
                    };
                },
            });
        };
    },
});

export default Virtual;
