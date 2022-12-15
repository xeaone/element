import { FragmentNode, VirtualNode } from './types.ts';

/**
 * todo: handle cdata
 */

// const VirtualCache = new Map();

const TextType = Node.TEXT_NODE;
const ElementType = Node.ELEMENT_NODE;
const CommentType = Node.COMMENT_NODE;
const AttributeType = Node.ATTRIBUTE_NODE;

const TEXT = 'Text';
const COMMENT = 'Comment';
const IN_OPEN = 'InOpen';
const IN_CLOSE = 'InClose';
const ELEMENT_NAME = 'ElementName';
const ATTRIBUTE_NAME = 'AttributeName';
const ATTRIBUTE_VALUE = 'AttributeValue';
const ELEMENT_CHILDREN = 'ElementChildren';

const special = ['SCRIPT', 'STYLE'];
const empty = ['AREA', 'BASE', 'BASEFONT', 'BR', 'COL', 'FRAME', 'HR', 'IMG', 'INPUT', 'ISINDEX', 'LINK', 'META', 'PARAM', 'EMBED'];

export default function virtual(data: string): FragmentNode {
    // const cache = VirtualCache.get(data);
    // if (cache) return cache;

    const fragment: VirtualNode = {
        id: 1,
        type: 11,
        children: [],
        name: 'fragment',
    };

    let id = 1;
    let mode = ELEMENT_CHILDREN;
    let node = fragment;

    for (let i = 0; i < data.length; i++) {
        const c = data[i];

        if (mode === ELEMENT_NAME) {
            if (c === ' ') {
                mode = IN_OPEN;
            } else if (c === '/') {
                i++;
                mode = ELEMENT_CHILDREN;
                node.closed = true;
                node = node.parent;
            } else if (c === '>') {
                if (special.includes(node.name)) mode = ELEMENT_CHILDREN;
                else mode = ELEMENT_CHILDREN;

                if (empty.includes(node.name)) {
                    node.closed = true; // close the current element node
                    node = node.parent; // change current element node to parent node
                }
            } else {
                node.name += c.toUpperCase();
            }
        } else if (mode === ATTRIBUTE_NAME) {
            if (c === ' ') {
                mode = IN_OPEN;
                node = node.parent;
            } else if (c === '/') {
                i++;
                mode = ELEMENT_CHILDREN;
                node = node.parent;
                node.closed = true;
            } else if (c === '>') {
                if (special.includes(node.name)) mode = ELEMENT_CHILDREN;
                else mode = ELEMENT_CHILDREN;
                node = node.parent; // change current node from attribute node to parent node
                if (empty.includes(node.name)) node.closed = true; // close the parent element node
            } else if (c === '=') {
                i++;
                mode = ATTRIBUTE_VALUE;
            } else {
                node.name += c;
            }
        } else if (mode === ATTRIBUTE_VALUE) {
            if (c === '"') {
                mode = IN_OPEN;
                node = node.parent;
            } else {
                node.value += c;
            }
        } else if (mode === IN_OPEN) {
            if (c === ' ') {
                continue;
            } else if (c === '/') {
                i++;
                mode = ELEMENT_CHILDREN;
                node.closed = true;
                node = node.parent;
            } else if (c === '>') {
                if (special.includes(node.name)) mode = ELEMENT_CHILDREN;
                else mode = ELEMENT_CHILDREN;

                if (empty.includes(node.name)) {
                    node.closed = true; // close the current element node
                    node = node.parent; // change the current element node to parent node
                }
            } else {
                node = {
                    id: id += 1,
                    name: c === ' ' ? '' : c,
                    value: '',
                    parent: node,
                    type: AttributeType,
                };
                node.parent.attributes.push(node);
                mode = ATTRIBUTE_NAME;
            }
        } else if (mode === IN_CLOSE) {
            if (c === '>') {
                mode = ELEMENT_CHILDREN;
            } else {
                continue;
            }
        } else if (mode === TEXT) {
            const next = data[i + 1];
            if (c === '<' && next === '/') { // close tag
                i++;
                mode = IN_CLOSE;
                node = node.parent;
                node = node.parent;
            } else if (c === '<' && next === '!') { // start comment
                node = node.parent;
                i++;
                mode = COMMENT;
                node = {
                    id: id += 1,
                    value: '',
                    parent: node,
                    name: '#comment',
                    type: CommentType,
                }
                node.parent.children.push(node);
            } else if (c === '<') { // start element
                node = node.parent;
                node = {
                    id: id += 1,
                    name: '',
                    parent: node,
                    children: [],
                    attributes: [],
                    type: ElementType,
                };
                node.parent.children.push(node);
                mode = ELEMENT_NAME;
            } else { // collect text
                node.value += c;
            }
        } else if (mode === ELEMENT_CHILDREN) {
            const next = data[i + 1];
            if (c === '<' && next === '/') { // close tag
                i++;
                mode = IN_CLOSE;
                node = node.parent;
            } else if (c === '<' && next === '!') {  // start comment
                i++;
                mode = COMMENT;
                node = {
                    id: id += 1,
                    value: '',
                    parent: node,
                    name: '#comment',
                    type: CommentType,
                }
                node.parent.children.push(node);
            } else if (c === '<') { // start element
                node = {
                    id: id += 1,
                    name: '',
                    parent: node,
                    children: [],
                    attributes: [],
                    type: ElementType,
                };
                node.parent.children.push(node);
                mode = ELEMENT_NAME;
            } else { // start text
                node = {
                    id: id += 1,
                    value: c,
                    parent: node,
                    name: '#text',
                    type: TextType,
                };
                node.parent.children.push(node);
                mode = TEXT;
            }
        } else if (mode === COMMENT) {
            if (c === '>') { // close comment
                mode = ELEMENT_CHILDREN;
                if (node.value.startsWith('--')) node.value = node.value.slice(2);
                if (node.value.endsWith('--')) node.value = node.value.slice(0, -2);
                node = node.parent;
            } else { // collect comment
                node.value += c;
            }
        }
    }

    // VirtualCache.set(data, fragment);

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
