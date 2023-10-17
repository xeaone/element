import {
    isName,
    isAlphabet,
    isOpenSquareBracket, isCloseSquareBracket,
    isOpenCurelyBracket, isCloseCurelyBracket,
    isLesser, isBang, isSpace, isDash, isEqual, isForward, isGreater,
} from './codes';

import {
    CHILDREN,
    RESTRICTED, TEXT, CDATA, COMMENT,
    TAG_OPEN_NAME, TAG_CLOSE_NAME,
    ATTRIBUTE_NAME, ATTRIBUTE_VALUE,

    vMode, vNode, vChild, vText, vCdata, vParent, vElement, vComment, vDocument, vAttribute,

    isRestricted, isVoided, appendText, appendCdata, appendComment, appendElement,
    appendAttribute, appendAttributeName, appendAttributeValue,
} from './tool';

type vEvents = {
    element: (node: vElement) => void,
    attribute: (node: vAttribute) => void,
};

export default function parse (data: string, events?: vEvents) {
    const l = data.length;
    const root = new vDocument();

    let i = 0;
    let back = 0;
    let forward = 0;
    let mode: vMode = CHILDREN;
    let node: vNode = root;

    let tagClose = '';

    for (i; i < l; i++) {

        if (back && forward) {
            throw new Error('expected forward or back');
        }

        if (back) {
            i = i - back;
            back = 0;
        }

        if (forward) {
            i = i + forward;
            forward = 0;
        }

        const c = data[ i ];
        const c1 = data.codePointAt(i) as number;
        const c2 = data.codePointAt(i + 1) as number;
        const c3 = data.codePointAt(i + 2) as number;
        const c4 = data.codePointAt(i + 3) as number;

        if (mode === CHILDREN) {

            if (isLesser(c1) && isBang(c2) && isOpenSquareBracket(c3)) { // <![
                node = appendCdata(node as vParent);
                mode = CDATA;
                forward = 8;
            } else if (isLesser(c1) && isBang(c2) && isDash(c3) && isDash(c4)) { // <!--
                node = appendComment(node as vParent);
                mode = COMMENT;
                forward = 3;
            } else if (isLesser(c1) && isForward(c2)) { // </
                mode = TAG_CLOSE_NAME;
                forward = 1;
            } else if (
                isLesser(c1) && isAlphabet(c2) || // <[a-zA-Z]
                isLesser(c1) && isOpenCurelyBracket(c2) && isOpenCurelyBracket(c3) // <{{
            ) {
                node = appendElement(node as vParent);
                mode = TAG_OPEN_NAME;
            } else {
                node = appendText(node as vParent);
                node.data += c;
                mode = TEXT;
            }

        } else if (mode === TAG_OPEN_NAME) {

            if (
                isForward(c1) ||
                isSpace(c1) && isSpace(c2)
            ) {
                continue;
            } else if (isSpace(c1)) {
                events?.element(node as vElement);
                node = appendAttribute(node as vElement);
                mode = ATTRIBUTE_NAME;
            } else if (isGreater(c1)) {
                events?.element(node as vElement);
                if (isRestricted(node.name)) {
                    node = appendText(node as vParent);
                    mode = TEXT;
                } else if (isVoided(node.name)) {
                    node = node.parent;
                    mode = CHILDREN;
                } else {
                    mode = CHILDREN;
                }
            } else {
                node.name += c;
            }

        } else if (mode === TAG_CLOSE_NAME) {
            // if closed tag does not match tag
            // then close previous siblining with the close tag as text
            // handle the reset of everything as text unless match close tag found then close

            // if (isSpace(c1)) {
            //     continue;
            // } else
            if (isGreater(c1)) {
                if (isRestricted(node.name)) {
                    node = node.parent;
                    node = appendText(node as vParent);
                    mode = TEXT;
                } else if (isVoided(node.name)) {
                    node = node.parent;
                    mode = CHILDREN;
                } else {
                    if (node.name !== tagClose) {
                        console.warn(`tag close not found ${node.name} ${tagClose}`);
                    }
                    node = node.parent;
                    mode = CHILDREN;
                }
                tagClose = '';
            } else {
                tagClose += c;
            }

        } else if (mode === ATTRIBUTE_NAME) {

            if (
                isForward(c1) ||
                isSpace(c1) && isSpace(c2)
            ) {
                continue;
            } else if (isSpace(c1)) {
                events?.attribute(node as vAttribute);
                node = node.parent;
                mode = TAG_OPEN_NAME;
                back = 1;
            } else if (isGreater(c1)) {
                events?.attribute(node as vAttribute);
                node = node.parent;
                mode = TAG_OPEN_NAME;
                back = 1;
            } else if (isEqual(c1)) {
                mode = ATTRIBUTE_VALUE;
            } else {
                node.name += c;
            }

        } else if (mode === ATTRIBUTE_VALUE) {

            if (
                (node as vAttribute).value.charAt(0) === '"' ||
                (node as vAttribute).value.charAt(0) === '\''
            ) {
                if ((node as vAttribute).value.charAt(0) === c) {
                    (node as vAttribute).value = (node as vAttribute).value.slice(1);
                    events?.attribute(node as vAttribute);
                    node = node.parent;
                    mode = TAG_OPEN_NAME;
                } else {
                    (node as vAttribute).value += c;
                }
            } else if (isForward(c1) || isSpace(c1) && isSpace(c2)) {
                continue;
            } else if (isSpace(c1)) {
                events?.attribute(node as vAttribute);
                node = node.parent;
                mode = TAG_OPEN_NAME;
                back = 1;
            } else if (isGreater(c1)) {
                events?.attribute(node as vAttribute);
                node = node.parent;
                mode = TAG_OPEN_NAME;
                back = 1;

                // } else if (equal('{{')) {
                //     i++;
                //     appendAttributeValue(node as vElement, '{{');
                // } else if (equal('}}')) {
                //     i++;
                //     appendAttributeValue(node as vElement, '}}');
            } else {
                (node as vAttribute).value += c;
            }

        } else if (mode === TEXT) {

            if (isLesser(c1)) {
                node = node.parent;
                mode = CHILDREN;
                back = 1;
            } else if (isOpenCurelyBracket(c1) && isOpenCurelyBracket(c2)) {
                node = node.parent;
                node = appendText(node as vParent);
                (node as vText).data += '{{';
                forward = 1;
            } else if (isCloseCurelyBracket(c1) && isCloseCurelyBracket(c2)) {
                (node as vText).data += '}}';
                node = node.parent;
                node = appendText(node as vParent);
                forward = 1;
            } else {
                (node as vText).data += c;
            }

        } else if (mode === CDATA) {

            if (isCloseSquareBracket(c1) && isCloseSquareBracket(c2) && isGreater(c3)) { // ]]>
                node = node.parent;
                mode = CHILDREN;
                forward = 2;
            } else {
                (node as vCdata).data += c;
            }

        } else if (mode === COMMENT) {

            if (isDash(c1) && isDash(c2) && isGreater(c3)) { // -->
                node = node.parent;
                mode = CHILDREN;
                forward = 2;
            } else {
                (node as vComment).data += c;
            }

        } else if (mode === RESTRICTED) {

            if (
                isLesser(c1) &&
                isForward(c2) &&
                data.substring(i + 2, i + 2 + node.parent.name.length).toLowerCase() === node.parent.name.toLowerCase()
            ) {
                node = node.parent;
                mode = TAG_CLOSE_NAME;
                forward = 2 + node.name.length;
            } else {
                (node as vText).data += c;
            }

        } else {
            throw new Error('parse mode not valid');
        }

    }

    return root;
};
