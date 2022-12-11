/**
 * todo: need to handle comments and specail svg
 */

type TextNode = {
    id: number;
    type: number;
    name: string;
    value: string;
    parent: ElementNode;
};

type AttributeNode = {
    id: number;
    type: number;
    name: string;
    value: string;
    parent: ElementNode;
};

type FragmentNode = {
    id: number;
    type: number;
    name: string;
    children: Array<ElementNode | TextNode>;
};

type ElementNode = {
    id: number;
    type: number;
    name: string;
    closed: boolean;
    attributes: Array<AttributeNode>;
    parent: FragmentNode | ElementNode;
    children: Array<ElementNode | TextNode>;
};

const TextType = 3;
const ElementType = 1;
const AttributeType = 2;

const TEXT = 'Text';
const IN_OPEN = 'InOpen';
const IN_CLOSE = 'InClose';

const ELEMENT_NAME = 'ElementName';
const ATTRIBUTE_NAME = 'AttributeName';
const ATTRIBUTE_VALUE = 'AttributeValue';
const ELEMENT_CHILDREN = 'ElementChildren';

const special = ['script', 'style'];
const empty = ['area', 'base', 'basefont', 'br', 'col', 'frame', 'hr', 'img', 'input', 'isindex', 'link', 'meta', 'param', 'embed'];

const parse = function (data: string) {
    const fragment: any = {
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
        const next = data[i + 1];

        if (mode === ELEMENT_NAME) {
            if (c === ' ') {
                mode = IN_OPEN;
            } else if (c === '/') {
                i++;
                mode = ELEMENT_CHILDREN;
                node.closed = true;
                node = node.parent;
            } else if (c === '>') {
                mode = ELEMENT_CHILDREN;
                if (empty.includes(node.name)) node.closed = true;
                if (special.includes(node.name)) mode = ELEMENT_CHILDREN;
                else mode = ELEMENT_CHILDREN;
            } else {
                node.name += c;
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
                mode = ELEMENT_CHILDREN;
                if (empty.includes(node.name)) node.closed = true;
                if (special.includes(node.name)) mode = ELEMENT_CHILDREN;
                else mode = ELEMENT_CHILDREN;
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
                if (empty.includes(node.name)) node.closed = true;
                if (special.includes(node.name)) mode = ELEMENT_CHILDREN;
                else mode = ELEMENT_CHILDREN;
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
            if (c === '<' && next === '/') {
                i++;
                mode = IN_CLOSE;
                node = node.parent;
                node = node.parent;
            } else if (c === '<') {
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
            } else {
                node.value += c;
            }
        } else if (mode === ELEMENT_CHILDREN) {
            // if (c === '<' && data[i + 1] === '!' && data[i + 2] === '-' && data[i + 2] === '-') {
            // } else
            if (c === '<' && next === '/') {
                i++;
                mode = IN_CLOSE;
                node = node.parent;
            } else if (c === '<') {
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
            } else {
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
        }
    }

    return fragment;
};

const serialize = function (data: any) {
    let result = '';

    const children = data.children;

    for (const child of children) {
        if (child.type === ElementType) {
            result += `<${child.name}`;

            for (const attribute of child.attributes) {
                if (attribute.value) {
                    result += ` ${attribute.name}="${attribute.value}"`;
                } else {
                    result += ` ${attribute.name}`;
                }
            }

            if (child.closed) {
                result += ` />`;
            } else {
                result += `>`;
                result += serialize(child);
                result += `</${child.name}>`;
            }
        } else if (child.type === TextType) {
            result += `${child.value}`;
        }
    }

    return result;
};

const log = function (data: any) {
    console.log(JSON.stringify(
        data,
        function (key, value) {
            if (key == 'parent') return value.id;
            else return value;
        },
        '  ',
    ));
};

const tests = [
    `<2 3="3" /><4 5="5">6</4><7 8 />`,
    `<input checked >`,
    `<input value="2" />`,
    `
        <2 3="3" />
        <4 5="5">6</4>
        <7 8 />
    `,
    `
        <2 3="3" />
        <4 5="5">
            <6>
                <7>8</7>
            </6>
        </4>
        <9 10 />
    `,
    '<style>div { background:color; }</style>',
    '<script>console.log("hello world");</script>',
];

for (const test of tests) {
    const d = parse(test);
    const s = serialize(d);
    if (s === test) {
        console.log('pass');
    } else {
        console.log('fail', test, s);
        log(d);
    }
}
