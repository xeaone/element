/**
 * - handle cdata
 */

const TEXT = 'Text';
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
const closed = /area|base|basefont|br|col|frame|hr|img|input|isindex|link|meta|param|embed/i;

// const PareCache = new WeakMap();

export default function parse(data: string): HTMLTemplateElement {
    const template = document.createElement('template');
    const content = template.content;
    const l = data.length;

    let i = 0;
    let n: Element | DocumentFragment = content;
    let mode = ELEMENT_CHILDREN;

    const elementChildrenMode = function () {

        if (texted.test(elementName)) {
            mode = TEXT;
            n = elementNode ?? content;
        }else if (closed.test(elementName)) {
            mode = ELEMENT_CHILDREN;
        } else {
            n = elementNode ?? content;
            mode = ELEMENT_CHILDREN;
        }

        elementNode = undefined;
        elementName = '';
        attributeValue = '';
        attributeName = '';
    };

    const elementOpenMode = function () {
        mode = ELEMENT_OPEN;
        attributeName = '';
        attributeValue = '';
    };

    const attributeNameValue = function () {
        (elementNode as Element).setAttribute(attributeName, attributeValue);
        attributeName = '';
        attributeValue = '';
    };

    let elementNode: Element | undefined;

    let text = '';
    let comment = '';
    let elementName = '';
    let attributeName = '';
    let attributeValue = '';

    for (i; i < l; i++) {
        const c = data[i];
        if (mode === ELEMENT_CHILDREN) {
            const next = data[i + 1];
            if (c === '<' && next === '/') { // close tag
                i++;
                n = n.parentElement ?? content;
                mode = ELEMENT_CLOSE;
            } else if (c === '<' && next === '!') { // start comment
                i++;
                mode = COMMENT;
            } else if (c === '<') { // start element
                mode = ELEMENT_NAME;
            } else { // start text
                text += c;
                mode = TEXT;
            }
        } else if (mode === ELEMENT_NAME) {
            if (space.test(c)) {
                elementNode = n.ownerDocument.createElement(elementName);
                n.appendChild(elementNode);
                elementOpenMode();
            } else if (c === '/') {
                elementNode = n.ownerDocument.createElement(elementName);
                n.appendChild(elementNode);
                elementChildrenMode();
                i++;
            } else if (c === '>') {
                elementNode = n.ownerDocument.createElement(elementName);
                n.appendChild(elementNode);
                elementChildrenMode();
            } else if (mode === ELEMENT_NAME) {
                elementName += c;
            }
        } else if (mode === ATTRIBUTE_NAME) {
            if (space.test(c)) {
                (elementNode as Element).setAttribute(attributeName, '');
                elementOpenMode();
            } else if (c === '/') {
                (elementNode as Element).setAttribute(attributeName, '');
                elementChildrenMode();
                i++;
            } else if (c === '>') {
                (elementNode as Element).setAttribute(attributeName, '');
                elementChildrenMode();
            } else if (c === '=') {
                mode = ATTRIBUTE_VALUE;
            } else {
                attributeName += c;
            }
        } else if (mode === ATTRIBUTE_VALUE) {
            if (attributeValue.startsWith(`"`) || attributeValue.startsWith(`'`)) {
                if ((attributeValue.startsWith(`"`) && c === `"`) || (attributeValue.startsWith(`'`) && c === `'`)) {
                    attributeValue = attributeValue.slice(1);
                    attributeNameValue();
                    elementOpenMode();
                } else {
                    attributeValue += c;
                }
            } else if (space.test(c)) {
                attributeNameValue();
                elementOpenMode();
            } else if (c === '/') {
                attributeNameValue();
                elementChildrenMode();
                i++;
            } else if (c === '>') {
                attributeNameValue();
                elementChildrenMode();
            } else if (c === '{' && data[i+1] === '{') {
                i++;
                attributeValue += '{{';
            } else if (c === '}' && data[i+1] === '}') {
                i++;
                attributeValue += '}}';
            } else {
                attributeValue += c;
            }
        } else if (mode === ELEMENT_CLOSE) {
            if (c === '>') {
                elementChildrenMode();
            } else {
                continue;
            }
        } else if (mode === ELEMENT_OPEN) {
            if (space.test(c)) {
                continue;
            } else if (c === '/') {
                elementChildrenMode();
                i++;
            } else if (c === '>') {
                elementChildrenMode();
            } else {
                attributeName += c;
                mode = ATTRIBUTE_NAME;
            }
        } else if (mode === TEXT) {
            const next = data[i + 1];
            if (c === '<' && next === '/') { // close tag
                if (text) n.appendChild(n.ownerDocument.createTextNode(text));
                text = '';
                text = '';
                elementName = '';
                elementNode = undefined;
                n = n.parentElement ?? content;
                i++;
                mode = ELEMENT_CLOSE;
                // console.log('textMode -> closeMode');
            } else if (c === '<' && next === '!') { // start comment
                if (text) n.appendChild(n.ownerDocument.createTextNode(text));
                text = '';
                comment = '';
                mode = COMMENT;
                i = i+3;
                // console.log('textMode -> commentMode');
            } else if (c === '<') { // start element
                if (text) n.appendChild(n.ownerDocument.createTextNode(text));
                text = '';
                elementName = '';
                elementNode = undefined;
                n = n.parentElement ?? content;
                mode = ELEMENT_NAME;
                // console.log('textMode -> elementNameMode');
            } else if (c === '{' && next === '{') { // split text v
                if (text) n.appendChild(n.ownerDocument.createTextNode(text));
                text = '{{';
                i++;
                // console.log('textMode -> textDynamicMode');
            } else if (c === '}' && next === '}') { // split text v
                text += '}}';
                n.appendChild(n.ownerDocument.createTextNode(text));
                text = '';
                i++;
                // console.log('textDynamicMode -> textMode');
            } else { // collect text
                text += c;
            }
        } else if (mode === COMMENT) {
            if (c === '-' && data[i+1] === '-' && data[i+2] === '>') { // close comment
                n.appendChild(n.ownerDocument.createComment(comment));
                i = i+2;
                mode = ELEMENT_CHILDREN;
            } else { // collect comment
                comment += c;
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

    return template;
}
