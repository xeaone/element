import { FragmentNode, VirtualNode } from './types.ts';
import booleans from './booleans.ts';

/**
 * todo: handle cdata
 */

type RealNode = Element | Comment | Text;

const TextType = Node.TEXT_NODE;
const ElementType = Node.ELEMENT_NODE;
const CommentType = Node.COMMENT_NODE;
const AttributeType = Node.ATTRIBUTE_NODE;
const FragmentType = Node.DOCUMENT_FRAGMENT_NODE;

const TEXT = 'Text';
const OPEN = 'Open';
const CLOSE = 'Close';
const IGNORE = 'Ignore';
const COMMENT = 'Comment';
const ELEMENT_NAME = 'ElementName';
const ATTRIBUTE_NAME = 'AttributeName';
const ATTRIBUTE_VALUE = 'AttributeValue';
const ELEMENT_CHILDREN = 'ElementChildren';

const space = /\s/;
const ignored = /script|style/i;
const closed = /area|base|basefont|br|col|frame|hr|img|input|isindex|link|meta|param|embed/i;

const OnCache = new WeakMap();

const patchAttribute = function (element: Element, attribute: any) {
    // Reflect.set(node, attribute.name, attribute.value);
    // node.setAttribute(attribute.name, attribute.value);
    const { name, value } = attribute;

    if (name === 'value') {
        // const result = display(value);
        if (element.getAttribute(name) === value) return;
        Reflect.set(element, name, value);
        element.setAttribute(name, value);
    } else if (name.startsWith('on')) {
        // element.setAttribute(name, value);
        // if (OnCache.get(element) === value) return;
        // Reflect.set(element, name, value);
        element.addEventListener(name.slice(2), value);
    } else if (booleans.includes(name)) {
        const result = value ? true : false;
        const has = element.hasAttribute(name);
        if (has === result) return;
        Reflect.set(element, name, result);
        if (result) element.setAttribute(name, '');
        else element.removeAttribute(name);
    } else {
        // const result = display(value);
        if (element.getAttribute(name) === value) return;
        // Reflect.set(element, name, value);
        (element as any)[name] = value;
        element.setAttribute(name, value);
    }
};

const patchLastNode = function (rNodeParent: Node | null | undefined, vNodeParent: VirtualNode) {
    // console.log('parent', rNodeParent, vNodeParent);
    if (!rNodeParent) throw new Error('real node not found');
    if (!vNodeParent) throw new Error('virtual node not found');

    const owner = rNodeParent.ownerDocument;

    if (!owner) throw new Error('owner not found');

    const position = vNodeParent.children.length - 1;
    const vNode = vNodeParent.children[position];
    const rNode = rNodeParent.childNodes[position];

    if (rNode) {
        if (rNode.nodeName !== vNode.name) {
            if (vNode.type === Node.ELEMENT_NODE) {
                const node = owner.createElement(vNode.name);
                for (const attribute of vNode.attributes) {
                    patchAttribute(node, attribute);
                }
                rNodeParent.replaceChild(node, rNode);
            } else if (vNode.type === Node.TEXT_NODE) {
                rNodeParent.replaceChild(owner.createTextNode(vNode.value), rNode);
            } else if (vNode.type === Node.COMMENT_NODE) {
                rNodeParent.replaceChild(owner.createComment(vNode.value), rNode);
            } else {
                throw new Error('type not handled');
            }
        } else {
            if (vNode.type === Node.ELEMENT_NODE) {
                for (const attribute of vNode.attributes) {
                    patchAttribute(rNode as Element, attribute);
                    // if ((rNode as Element).getAttribute(attribute.name) !== attribute.value) {
                    // Reflect.set(rNode, attribute.name, attribute.value);
                    // (rNode as Element).setAttribute(attribute.name, attribute.value);
                    // }
                }
            } else if (vNode.type === Node.TEXT_NODE) {
                if (rNode.nodeValue !== vNode.value) {
                    rNode.textContent = vNode.value;
                }
            } else if (vNode.type === Node.COMMENT_NODE) {
                if (rNode.nodeValue !== vNode.value) {
                    rNode.textContent = vNode.value;
                }
            } else {
                throw new Error('type not handled');
            }
        }
    } else {
        if (vNode.type === Node.ELEMENT_NODE) {
            const node = owner.createElement(vNode.name);
            for (const attribute of vNode.attributes) {
                patchAttribute(node, attribute);
                // Reflect.set(node, attribute.name, attribute.value);
                // node.setAttribute(attribute.name, attribute.value);
            }
            rNodeParent.appendChild(node);
        } else if (vNode.type === Node.TEXT_NODE) {
            rNodeParent.appendChild(owner.createTextNode(vNode.value));
        } else if (vNode.type === Node.COMMENT_NODE) {
            rNodeParent.appendChild(owner.createComment(vNode.value));
        } else {
            throw new Error('type not handled');
        }
    }
};

export default function parse(root: Element, values: unknown[], data: string): FragmentNode {
    const fragment: VirtualNode = { type: FragmentType, children: [], name: 'fragment' };

    let i = 0;
    let v = fragment;
    let n: Node | undefined | null = root;
    const l = data.length;
    let mode = ELEMENT_CHILDREN;

    const childrenSlashMode = function () {
        const last = v.children[v.children.length - 1];
        last.name = last.name.toUpperCase();
        last.closed = true;
        patchLastNode(n, v);
        mode = ELEMENT_CHILDREN;
        i++;
        // console.log('childrenSlashMode -> ElementChildrenMode', last.name);
    };

    const childrenClosedMode = function () {
        const length = v.children.length;
        const last = v.children[length - 1];
        last.name = last.name.toUpperCase();
        last.closed = true;
        patchLastNode(n, v);
        mode = ELEMENT_CHILDREN;
        // console.log('childrenClosedMode -> ElementChildredMode', last.name);
    };

    const childrenIgnoreMode = function () {
        const last = v.children[v.children.length - 1];
        last.name = last.name.toUpperCase();
        patchLastNode(n, v);
        last.children.push({ value: '', parent: v, name: '#text', type: TextType });
        mode = IGNORE;
        // console.log('childrenIgnoreMode -> IgnoreMode');
    };

    const childrenMode = function () {
        const length = v.children.length;
        const last = v.children[length - 1];
        last.name = last.name.toUpperCase();
        patchLastNode(n, v);
        n = n?.childNodes[length - 1];
        v = v?.children[length - 1];
        mode = ELEMENT_CHILDREN;
        // console.log('childrenMode -> elementChildrenMode', last.name);
    };

    for (i; i < l; i++) {
        const c = data[i];
        if (mode === ELEMENT_CHILDREN) {
            const next = data[i + 1];
            if (c === '<' && next === '/') { // close tag
                i++;
                v = v.parent;
                n = n?.parentNode;
                mode = CLOSE;
                // console.log('elementChildrenMode -> closeMode');
            } else if (c === '<' && next === '!') { // start comment
                i++;
                v.children.push({ value: '', name: '#comment', parent: v, type: CommentType });
                mode = COMMENT;
                // console.log('elementChildrenMode -> CommentMode');
            } else if (c === '<') { // start element
                v.children.push({ name: '', children: [], attributes: [], parent: v, type: ElementType });
                mode = ELEMENT_NAME;
                // console.log('elementChildrenMode -> elementNameMode');
            } else { // start text
                v.children.push({ value: c, name: '#text', parent: v, type: TextType });
                mode = TEXT;
                // console.log('elementChildrenMode -> textMode');
            }
        } else if (mode === ELEMENT_NAME) {
            if (space.test(c)) {
                mode = OPEN;
                // console.log('openMode -> elementNameMode');
            } else if (c === '/') {
                childrenSlashMode();
            } else if (c === '>') {
                const last = v.children[v.children.length - 1];
                if (closed.test(last.name)) childrenClosedMode();
                else if (ignored.test(last.name)) childrenIgnoreMode();
                else childrenMode();
            } else if (mode === ELEMENT_NAME) {
                const last = v.children[v.children.length - 1];
                last.name += c;
            }
        } else if (mode === ATTRIBUTE_NAME) {
            if (space.test(c)) {
                mode = OPEN;
                // console.log('attributeNameMode -> elementNameMode');
            } else if (c === '/') {
                childrenSlashMode();
            } else if (c === '>') {
                const last = v.children[v.children.length - 1];
                if (closed.test(last.name)) childrenClosedMode();
                else if (ignored.test(last.name)) childrenIgnoreMode();
                else childrenMode();
            } else if (c === '=') {
                const last = v.children[v.children.length - 1];
                if (data[i + 1] === '"') {
                    i++;
                    last.attributes[last.attributes.length - 1].quoted = true;
                }
                mode = ATTRIBUTE_VALUE;
                // console.log('attributeNameMode -> attributeValueMode');
            } else {
                const last = v.children[v.children.length - 1];
                last.attributes[last.attributes.length - 1].name += c;
            }
        } else if (mode === ATTRIBUTE_VALUE) {
            const next = data[i + 1];
            const last = v.children[v.children.length - 1];
            const attribute = last.attributes[last.attributes.length - 1];
            if (attribute.quoted) {
                if (c === '"') {
                    mode = OPEN;
                    // console.log('attributeValueMode -> openMode');
                } else {
                    attribute.value += c;
                }
            } else if (space.test(c)) {
                mode = OPEN;
            } else if (c === '/') {
                childrenSlashMode();
            } else if (c === '>') {
                if (closed.test(last.name)) childrenClosedMode();
                else if (ignored.test(last.name)) childrenIgnoreMode();
                else childrenMode();
            } else if (c === '}' && next === '}') {
                i++;
                attribute.value = values[attribute.value];
                // attribute.value += `${values[attribute.dynamic]}`;
                // delete attribute.dynamic;
            } else if (c === '{' && next === '{') {
                i++;
                // attribute.dynamic = '';
                // } else if ('dynamic' in attribute) {
                // attribute.dynamic += c;
            } else {
                attribute.value += c;
            }
        } else if (mode === CLOSE) {
            if (c === '>') {
                mode = ELEMENT_CHILDREN;
                // console.log('closeMode -> elementChildrenMode');
            } else {
                continue;
            }
        } else if (mode === OPEN) {
            if (space.test(c)) {
                continue;
            } else if (c === '/') {
                childrenSlashMode();
            } else if (c === '>') {
                const last = v.children[v.children.length - 1];
                if (closed.test(last.name)) childrenClosedMode();
                else if (ignored.test(last.name)) childrenIgnoreMode();
                else childrenMode();
            } else {
                const last = v.children[v.children.length - 1];
                last.attributes.push({ name: c, value: '', type: AttributeType });
                mode = ATTRIBUTE_NAME;
                // console.log('openMode -> attributeValueMode');
            }
        } else if (mode === TEXT) {
            const next = data[i + 1];
            if (c === '<' && next === '/') { // close tag
                patchLastNode(n, v);
                v = v.parent;
                n = n?.parentNode;
                i++;
                mode = CLOSE;
                // console.log('textMode -> closeMode');
            } else if (c === '<' && next === '!') { // start comment
                patchLastNode(n, v);
                v.children.push({ value: '', name: '#comment', parent: v, type: CommentType });
                i++;
                mode = COMMENT;
                // console.log('textMode -> commentMode');
            } else if (c === '<') { // start element
                patchLastNode(n, v);
                v.children.push({ name: '', children: [], attributes: [], parent: v, type: ElementType });
                mode = ELEMENT_NAME;
                // console.log('textMode -> elementNameMode');
            } else if (c === '}' && next === '}') { // split text v
                const last = v.children[v.children.length - 1];
                last.value = values[last.value];
                patchLastNode(n, v);
                v.children.push({ value: '', name: '#text', parent: v, type: TextType });
                i++;
                // console.log('textDynamicMode -> textMode');
            } else if (c === '{' && next === '{') { // split text v
                patchLastNode(n, v);
                v.children.push({ name: '#text', value: '', parent: v, type: TextType });
                i++;
                // console.log('textMode -> textDynamicMode');
            } else { // collect text
                const last = v.children[v.children.length - 1];
                last.value += c;
            }
        } else if (mode === COMMENT) {
            if (c === '>') { // close comment
                if (v.last.value.startsWith('--')) v.last.value = v.last.value.slice(2);
                if (v.last.value.endsWith('--')) v.last.value = v.last.value.slice(0, -2);
                mode = ELEMENT_CHILDREN;
            } else { // collect comment
                v.last.value += c;
            }
        } else if (mode === IGNORE) {
            const last = v.children[v.children.length - 1][0];
            if (c === '>') { // close ignored
                last.value = last.value.slice(0, -(last.name.length + 2));
                patchLastNode(n, v);
                mode = ELEMENT_CHILDREN;
            } else { // collect ignored
                last.value += c;
            }
        }
    }

    return fragment;
}

// export const serialize = function (data: VirtualNode) {
//     let result = '';

//     const children = data.children;

//     for (const child of children) {
//         if (child.type === ElementType) {
//             result += `<${child.name}`;

//             for (const attribute of child.attributes) {
//                 if (attribute.value) {
//                     result += ` ${attribute.name}="${attribute.value}"`;
//                 } else {
//                     result += ` ${attribute.name}`;
//                 }
//             }

//             if (child.closed) {
//                 result += ` />`;
//             } else {
//                 result += `>`;
//                 result += serialize(child);
//                 result += `</${child.name}>`;
//             }
//         } else if (child.type === TextType) {
//             result += `${child.value}`;
//         }
//     }

//     return result;
// };

// const log = function (data: any) {
//     console.log(JSON.stringify(
//         data,
//         function (key, value) {
//             if (key == 'parent') return value.id;
//             else return value;
//         },
//         '  ',
//     ));
// };

// const tests = [
//     `<2 3="3" /><4 5="5">6</4><7 8 />`,
//     `<input checked >`,
//     `<input value="2" />`,
//     `
//         <2 3="3" />
//         <4 5="5">6</4>
//         <7 8 />
//     `,
//     `
//         <2 3="3" />
//         <4 5="5">
//             <6>
//                 <7>8</7>
//             </6>
//         </4>
//         <9 10 />
//     `,
//     '<style>div { background:color; }</style>',
//     '<script>console.log("hello world");</script>',
// ];

// for (const test of tests) {
//     const d = parse(test);
//     const s = serialize(d);
//     if (s === test) {
//         console.log('pass');
//     } else {
//         console.log('fail', test, s);
//         log(d);
//     }
// }
