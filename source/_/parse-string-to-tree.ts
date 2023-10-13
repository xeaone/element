/**
 * - handle cdata
 */
const TEXT = 'Text';
const CDATA = 'CDATA';
const ELEMENT_OPEN = 'ElementOpen';
const ELEMENT_CLOSE = 'ElementClose';
// const IGNORE = 'Ignore';
const COMMENT = 'Comment';
const ELEMENT_NAME = 'ElementName';
const ATTRIBUTE_NAME = 'AttributeName';
const ATTRIBUTE_VALUE = 'AttributeValue';
const ELEMENT_CHILDREN = 'ElementChildren';

const space = /\s|\t|\n|\f|\r/;
const texted = /script|textarea/i;
const voids = /area|base|basefont|br|col|frame|hr|img|input|isindex|link|meta|param|embed/i;

const TEXT_NODE = 3;
const ELEMENT_NODE = 1;
const COMMENT_NODE = 8;
const CDATA_SECTION_NODE = 4;
const DOCUMENT_FRAGMENT_NODE = 11;

// const PareCache = new WeakMap();

class vCdata {
    type = 4;
    data = '';
    name = '#cdata-section';
    parent: vParent;
    constructor (parent: vParent) {
        this.parent = parent;
    }
}

class vComment {
    type = 8;
    data = '';
    name = '#comment';
    parent: vParent;
    constructor (parent: vParent) {
        this.parent = parent;
    }
}

class vText {
    type = 3;
    data = '';
    name = '#text';
    parent: vParent;
    constructor (parent: vParent) {
        this.parent = parent;
    }
}

class vElement {
    type = 1;
    name = '';
    parent: vParent;
    children: vChild[] = [];
    attributes: vAttribute[] = [];
    constructor (parent: vParent) {
        this.parent = parent;
    }
}

class vDocument {
    type = 11;
    parent = this;
    name = '#document-fragment';
    children: vChild[] = [];
}

type vAttribute = [ name: string, value: string ];

const appendElement = (parent: vParent) => {
    const child = new vElement(parent);
    parent.children.push(child);
    return child;
};

const appendComment = (parent: vParent) => {
    const child = new vComment(parent);
    parent.children.push(child);
    return child;
};

const appendCdata = (parent: vParent) => {
    const child = new vCdata(parent);
    parent.children.push(child);
    return child;
};

const appendText = (parent: vParent) => {
    const child = new vText(parent);
    parent.children.push(child);
    return child;
};

const appendAttribute = (element: vElement, name: string) => {
    const attribute: vAttribute = [ name, '' ];
    element.attributes.push(attribute);
    return attribute as vAttribute;
};

const appendAttributeName = (element: vElement, name: string) => {
    const attr = element.attributes[ element.attributes.length - 1 ];
    if (!attr) throw new Error(`expected attr ${element.name}`);
    attr[ 0 ] += name;
};

const appendAttributeValue = (element: vElement, value: string) => {
    const attr = element.attributes[ element.attributes.length - 1 ];
    if (!attr) throw new Error(`expected attr ${element.name}`);
    attr[ 1 ] += value;
};

type vParent = vDocument | vElement;
type vChild = vElement | vComment | vCdata | vText;

export default function parse (data: string) {
    const l = data.length;
    const root = new vDocument();

    let i = 0;
    let n: vDocument | vChild | undefined = root;
    let mode = ELEMENT_CHILDREN;

    let attr: vAttribute | undefined;
    let node: vDocument | vChild = root;

    let elementNode: vChild | undefined;

    let text = '';
    let cdata = '';
    let comment = '';
    // let elementName = '';
    // let attributeName = '';
    let attributeValue = '';

    const equal = (part: string) => data.substring(i, i + part.length) === part;

    for (i; i < l; i++) {
        const c = data[ i ];
        if (mode === ELEMENT_CHILDREN) {
            if (equal('<![CDATA[')) {
                node = appendCdata(node as vParent);
                mode = CDATA;
                i = i + 8;

            } else if (equal('<!--')) {
                node = appendComment(node as vParent);
                mode = COMMENT;
                i = i + 3;
            } else if (equal('</')) {
                // node = node.parent;
                mode = ELEMENT_CLOSE;
                i++;
                // } else if (equal('<?')) {
                // i++;
                // } else if (equal('<!')) {
                // i++;
            } else if (c === '<') {
                node = appendElement(node as vParent);
                mode = ELEMENT_NAME;
            } else {
                node = appendText(node as vParent);
                mode = TEXT;
                i--;
            }
        } else if (mode === ELEMENT_NAME) {
            if (space.test(c)) {
                mode = ELEMENT_OPEN;
            } else if (c === '/') {
                mode = ELEMENT_OPEN;
            } else if (c === '>') {
                i--;
                mode = ELEMENT_OPEN;
            } else {
                node.name += c;
            }
        } else if (mode === ELEMENT_OPEN) {
            if (space.test(c)) {
                continue;
            } else if (c === '/') {
                i++;
                if (texted.test(node.name)) {
                    node = appendText(node as vParent);
                    mode = TEXT;
                } else if (voids.test(node.name)) {
                    node = node.parent;
                    mode = ELEMENT_CHILDREN;
                } else mode = ELEMENT_CHILDREN;
            } else if (c === '>') {
                if (texted.test(node.name)) {
                    node = appendText(node as vParent);
                    mode = TEXT;
                } else if (voids.test(node.name)) {
                    node = node.parent;
                    mode = ELEMENT_CHILDREN;
                } else mode = ELEMENT_CHILDREN;
            } else {
                attr = appendAttribute(node as vElement, c);
                mode = ATTRIBUTE_NAME;
            }
        } else if (mode === ELEMENT_CLOSE) {
            if (c === '>') {
                node = node.parent;
                mode = ELEMENT_CHILDREN;
            } else {
                continue;
            }
        } else if (mode === ATTRIBUTE_NAME) {
            if (space.test(c)) {
                attr = undefined;
                mode = ELEMENT_OPEN;
            } else if (c === '/') {
                attr = undefined;
                mode = ELEMENT_OPEN;
            } else if (c === '>') {
                i--;
                attr = undefined;
                mode = ELEMENT_OPEN;
            } else if (c === '=') {
                mode = ATTRIBUTE_VALUE;
            } else {
                appendAttributeName(node as vElement, c);
            }
        } else if (mode === ATTRIBUTE_VALUE) {
            if (!attr) {
                throw new Error('expected attr');
            } else if (attr[ 1 ].startsWith(`"`)) {
                if (c === `"`) {
                    attr[ 1 ] = attr[ 1 ].slice(1);
                    attr = undefined;
                    mode = ELEMENT_OPEN;
                } else {
                    appendAttributeValue(node as vElement, c);
                }
            } else if (space.test(c)) {
                attr = undefined;
                mode = ELEMENT_OPEN;
            } else if (c === '/') {
                attr = undefined;
                mode = ELEMENT_OPEN;
            } else if (c === '>') {
                i--;
                attr = undefined;
                mode = ELEMENT_OPEN;
            } else if (equal('{{')) {
                i++;
                appendAttributeValue(node as vElement, '{{');
            } else if (equal('}}')) {
                i++;
                appendAttributeValue(node as vElement, '}}');
            } else {
                appendAttributeValue(node as vElement, c);
            }
        } else if (mode === TEXT) {
            if (c === '<') {
                i--;
                node = node.parent;
                mode = ELEMENT_CHILDREN;
                // } else if (equal('{{')) {
                //     i++;
                //     (node as vText).data += '{{';
                // } else if (equal('}}')) {
                //     i++;
                //     (node as vText).data += '}}';
            } else {
                (node as vText).data += c;
            }
        } else if (mode === COMMENT) {
            if (equal('-->')) {
                i = i + 2;
                node = node.parent;
                mode = ELEMENT_CHILDREN;
            } else {
                (node as vComment).data += c;
            }
        } else if (mode === CDATA) {
            if (equal(']]>')) {
                i = i + 2;
                node = node.parent;
                mode = ELEMENT_CHILDREN;
            } else {
                (node as vCdata).data += c;
            }
        } else {
            throw new Error('parse mode error');
        }
        // } else if (mode === IGNORE) {
        // if (c === '>') { // close ignored
        // mode = ELEMENT_CHILDREN;
        // } else { // collect ignored
        // current += c;
        // }
        // }
    }

    return root;
};

export const stringify = (virtual: vDocument | vChild) => {
    const type = virtual.type;

    if (type === TEXT_NODE) {
        const data = (virtual as vText).data;
        return `${data}`;
    }

    if (type === COMMENT_NODE) {
        const data = (virtual as vComment).data;
        return `<!--${data}-->`;
    }

    if (type === CDATA_SECTION_NODE) {
        const data = (virtual as vCdata).data;
        return `<![CDATA[${data}]]>`;
    }

    if (type === ELEMENT_NODE) {
        const name = (virtual as vElement).name;
        const children = (virtual as vElement).children;
        const attributes = (virtual as vElement).attributes;
        const element: string[] = [ `<${name}` ];
        for (const [ name, value ] of attributes) {
            if (value) element.push(` ${name}="${value}"`);
            else element.push(` ${name}`);
        }
        if (voids.test(name)) {
            element.push('>');
        } else {
            element.push('>');
            for (const child of children) {
                element.push(stringify(child));
            }
            element.push(`</${name}>`);
        }
        return element.join('');
    }

    if (type === DOCUMENT_FRAGMENT_NODE) {
        const children = (virtual as vDocument).children;
        const template: string[] = [];
        for (const child of children) {
            template.push(stringify(child));
        }
        return template.join('');
    }

    throw new Error('invalid type');

};

export const construct = (virtual: vDocument | vChild) => {
    const type = virtual.type;

    if (type === TEXT_NODE) {
        const data = (virtual as vText).data;
        return document.createTextNode(data);
    }

    if (type === COMMENT_NODE) {
        const data = (virtual as vComment).data;
        return document.createComment(data);
    }

    if (type === CDATA_SECTION_NODE) {
        const data = (virtual as vCdata).data;
        return document.createCDATASection(data);
    }

    if (type === ELEMENT_NODE) {
        const name = (virtual as vElement).name;
        const children = (virtual as vElement).children;
        const element = document.createElement(name);
        children.forEach(child => element.appendChild(construct(child)));
        return element;
    }

    if (type === DOCUMENT_FRAGMENT_NODE) {
        const children = (virtual as vDocument).children;
        const template = document.createElement('template');
        children.forEach(child => template.appendChild(construct(child)));
        return template;
    }

    throw new Error('invalid type');

};


const original =/*html*/`
<html>
<head>
    <meta charset="utf-8">
    <title>All HTML Elements</title>
</head>
<body>

    <h1>All Valid HTML Elements</h1>

    <p>This document contains all valid HTML elements.</p>

    <h2>Heading 2</h2>
    <h3>Heading 3</h3>
    <h4>Heading 4</h4>
    <h5>Heading 5</h5>
    <h6>Heading 6</h6>

    <p>This is a paragraph.</p>
    <p>You can use paragraphs to format your text.</p>

    <ul>
        <li>This is an unordered list item.</li>
        <li>This is another unordered list item.</li>
    </ul>

    <ol>
        <li>This is an ordered list item.</li>
        <li>This is another ordered list item.</li>
    </ol>

    <img src="https://example.com/image.jpg" alt="Image alt text">

    <a href="https://example.com">This is a link.</a>

    <form action="/action_page.php">
        <input type="text" name="firstname" placeholder="First name">
        <input type="text" name="lastname" placeholder="Last name">
        <input type="submit" value="Submit">
    </form>

    <hr>
    <br>
    <div>This is a division.</div>
    <span>This is a span.</span>
    <pre>This is preformatted text.</pre>
    <code>This is code text.</code>
    <blockquote cite="https://example.com">This is a blockquote.</blockquote>
    <address>This is an address.</address>
    <abbr title="test">WWW</abbr>

    <svg><![CDATA[Some <CDATA> data & then some]]></svg>

</body>
</html>
`;

const v = parse(original);
const s = JSON.stringify(v, (key, value) => key === 'parent' ? undefined : value, '\t');
const j = JSON.parse(s);
await Deno.writeTextFile('tmp/parsed.json', s);
await Deno.writeTextFile('tmp/write.html', stringify(j));

const fileResult = await Deno.readTextFile('tmp/write.html');

console.log(fileResult === original);
