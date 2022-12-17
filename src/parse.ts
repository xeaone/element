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
const OPEN = 'Open';
const CLOSE = 'Close';
const IGNORE = 'Ignore';
const COMMENT = 'Comment';
const ELEMENT_NAME = 'ElementName';
const ATTRIBUTE_NAME = 'AttributeName';
const ATTRIBUTE_VALUE = 'AttributeValue';
const ELEMENT_CHILDREN = 'ElementChildren';

const special = ['SCRIPT', 'STYLE'];
const empty = ['AREA', 'BASE', 'BASEFONT', 'BR', 'COL', 'FRAME', 'HR', 'IMG', 'INPUT', 'ISINDEX', 'LINK', 'META', 'PARAM', 'EMBED'];

const spacePattern = /\s/;
const space = (c: string) => spacePattern.test(c);

export default function parse(data: string): FragmentNode {
    const fragment: VirtualNode = { type: 11, children: [], name: 'fragment' };

    let mode = ELEMENT_CHILDREN;
    let node = fragment;
    const l = data.length;

    for (let i = 0; i < l; i++) {
        const c = data[i];

        if (mode === ELEMENT_NAME) {
            if (space(c)) {
                node.name = node.name.toUpperCase();
                mode = OPEN;
            } else if (c === '/') {
                i++;
                node.name = node.name.toUpperCase();
                mode = ELEMENT_CHILDREN;
                node.closed = true;
                node = node.parent;
            } else if (c === '>') {
                node.name = node.name.toUpperCase();

                if (special.includes(node.name)) mode = IGNORE;
                else mode = ELEMENT_CHILDREN;

                if (empty.includes(node.name)) {
                    node.closed = true; // close the current element node
                    node = node.parent; // change current element node to parent node
                }
            } else {
                node.name += c;
            }
        } else if (mode === ATTRIBUTE_NAME) {
            if (space(c)) {
                mode = OPEN;
                node = node.parent;
            } else if (c === '/') {
                i++;
                mode = ELEMENT_CHILDREN;
                node = node.parent;
                node.closed = true;
            } else if (c === '>') {
                if (special.includes(node.name)) mode = IGNORE;
                else mode = ELEMENT_CHILDREN;
                node = node.parent; // change current node from attribute node to parent node
                if (empty.includes(node.name)) {
                    node.closed = true; // close the parent element node
                    node = node.parent; // change current node from attribute node to parent parent node
                }
            } else if (c === '=') {
                const next = data[i + 1];
                if (next === '"') i++;
                else node.closed = true;
                mode = ATTRIBUTE_VALUE;
            } else {
                node.name += c;
            }
        } else if (mode === ATTRIBUTE_VALUE) {
            if (node.closed) {
                if (space(c)) {
                    mode = OPEN;
                    node = node.parent;
                } else if (c === '/') {
                    i++;
                    mode = ELEMENT_CHILDREN;
                    node = node.parent;
                    node.closed = true;
                } else if (c === '>') {
                    if (special.includes(node.name)) mode = IGNORE;
                    else mode = ELEMENT_CHILDREN;
                    node = node.parent; // change current node from attribute node to parent node
                    if (empty.includes(node.name)) {
                        node.closed = true; // close the parent element node
                        node = node.parent; // change current node from attribute node to parent parent node
                    }
                } else {
                    node.value += c;
                }
            } else if (c === '"') {
                mode = OPEN;
                node = node.parent;
            } else {
                node.value += c;
            }
        } else if (mode === OPEN) {
            if (space(c)) {
                continue;
            } else if (c === '/') {
                i++;
                mode = ELEMENT_CHILDREN;
                node.closed = true;
                node = node.parent;
            } else if (c === '>') {
                if (special.includes(node.name)) mode = IGNORE;
                else mode = ELEMENT_CHILDREN;

                if (empty.includes(node.name)) {
                    node.closed = true; // close the current element node
                    node = node.parent; // change the current element node to parent node
                }
            } else {
                node = { name: c, value: '', parent: node, type: AttributeType };
                // node = { name: c === ' ' ? '' : c, value: '', parent: node, type: AttributeType };
                node.parent.attributes.push(node);
                mode = ATTRIBUTE_NAME;
            }
        } else if (mode === CLOSE) {
            if (c === '>') {
                mode = ELEMENT_CHILDREN;
            } else {
                continue;
            }
        } else if (mode === TEXT) {
            const next = data[i + 1];
            if (c === '<' && next === '/') { // close tag
                i++;
                mode = CLOSE;
                node = node.parent;
                node = node.parent;
            } else if (c === '<' && next === '!') { // start comment
                i++;
                mode = COMMENT;
                node = { value: '', parent: node.parent, name: '#comment', type: CommentType };
                node.parent.children.push(node);
            } else if (c === '<') { // start element
                node = { name: '', parent: node.parent, children: [], attributes: [], type: ElementType };
                node.parent.children.push(node);
                mode = ELEMENT_NAME;
            } else if (c === '}' && next === '}') { // split text node
                node.value += '}}';
                i++;
                node = node.parent;
                mode = ELEMENT_CHILDREN;
            } else if (c === '{' && next === '{') { // split text node
                node = { name: '#text', value: c, type: TextType, parent: node.parent };
                node.parent.children.push(node);
            } else { // collect text
                node.value += c;
            }
        } else if (mode === ELEMENT_CHILDREN) {
            const next = data[i + 1];
            if (c === '<' && next === '/') { // close tag
                i++;
                mode = CLOSE;
                node = node.parent;
            } else if (c === '<' && next === '!') { // start comment
                i++;
                mode = COMMENT;
                node = { value: '', parent: node, name: '#comment', type: CommentType };
                node.parent.children.push(node);
            } else if (c === '<') { // start element
                node = { name: '', parent: node, children: [], attributes: [], type: ElementType };
                node.parent.children.push(node);
                mode = ELEMENT_NAME;
            } else { // start text
                node = { value: c, parent: node, name: '#text', type: TextType };
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
        } else if (mode === IGNORE) {
            if (c === '>') { // close ignored
                mode = ELEMENT_CHILDREN;
                const child = node.children[0];
                child.value = child.value.slice(0, -(child.name.length + 2));
                node = node.parent;
            } else { // collect ignored
                if (!node.children[0]) {
                    node.children[0] = { value: '', parent: node, name: '#text', type: TextType };
                }
                node.children[0].value += c;
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
