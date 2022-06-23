import XElement from './element.ts';
import computer from './computer.ts';
import parser from './parser.ts';

export default class Binder {

    static handlers = [
        'on',
        'text',
        'html',
        'each',
        'value',
        'checked',
        'inherit',
        'standard'
    ];

    context: any;
    type: string;
    name: string;
    value: string;

    node: Node;
    owner: Element;
    container: XElement;

    compute: ($instance?: any) => any;

    references: Array<string>;
    rewrites: Array<Array<string>>;
    meta: Record<string, any> = {};

    register: XElement[ 'register' ];
    release: XElement[ 'release' ];

    constructor (node: Node, container: XElement, context: any, rewrites?: Array<Array<string>>) {

        this.node = node;
        this.context = context;
        this.container = container;
        this.rewrites = rewrites ?? [];

        this.name = node.nodeName.startsWith('#') ? node.nodeName.slice(1) : node.nodeName;
        this.value = node.nodeValue ?? '';
        this.type = this.name.startsWith('on') ? 'on' : this.name in Binder.handlers ? this.name : 'standard';

        this.owner = (node as Attr).ownerElement ?? node.parentElement ?? container;

        this.references = parser(this.value);
        this.compute = computer(this);

        this.register = this.container.register.bind(this.container);
        this.release = this.container.release.bind(this.container);
    }

}