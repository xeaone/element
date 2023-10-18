import {
    isAlphabet,
    isCurlOpen, isCurlClose,
    isSquareOpen, isSquareClose,
    isLess, isBang, isSpace, isDash, isEqual, isForward, isGreat, isD, isO,
} from './codes';

import {
    CHILDREN,
    RESTRICTED, TEXT, CDATA, COMMENT,
    TAG_OPEN_NAME, TAG_CLOSE_NAME,
    ATTRIBUTE_NAME, ATTRIBUTE_VALUE,

    vMode, vNode, vText, vCdata, vParent, vElement, vComment, vFragment, vAttribute,

    isRestricted, isVoided, appendText, appendCdata, appendComment, appendElement,
    appendAttribute,
    createFragment,
} from './tool';

type vEvents = {
    element: (node: vElement) => void,
    attribute: (node: vAttribute) => void,
};

export default function parse (data: string, events?: vEvents): vFragment {
    const l = data.length;
    const root = createFragment();

    let i: number = 0;
    let c: string = '';

    let mode: vMode = CHILDREN;
    let node: vNode = root;

    for (i; i < l; i++) {

        const c1 = data.codePointAt(i) as number;
        const c2 = data.codePointAt(i + 1) as number;
        const c3 = data.codePointAt(i + 2) as number;
        const c4 = data.codePointAt(i + 3) as number;

        if (mode === CHILDREN) {

            if (isLess(c1) && isBang(c2) && isDash(c3) && isDash(c4)) { // <!--
                node = appendComment(node as vParent);
                mode = COMMENT;
                i += 3;
            // } else if (isLess(c1) && isBang(c2) && isD(c3) && isO(c4)) { // <!DO or <!do
            //     node = appendDoctype(node as vParent);
            //     mode = DOCTYPE;
            //     i += ;
            } else if (isLess(c1) && isBang(c2) && isSquareOpen(c3)) { // <![
                node = appendCdata(node as vParent);
                mode = CDATA;
                i += 8;
            } else if (isLess(c1) && isForward(c2)) { // </
                mode = TAG_CLOSE_NAME;
                i += 1;
            } else if (
                isLess(c1) && isAlphabet(c2) || // <[a-zA-Z]
                isLess(c1) && isCurlOpen(c2) && isCurlOpen(c3) // <{{
            ) {
                node = appendElement(node as vParent);
                mode = TAG_OPEN_NAME;
            } else {
                node = appendText(node as vParent);
                c = String.fromCodePoint(c1);
                i += c.length - 1;
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
            } else if (isGreat(c1)) {
                events?.element(node as vElement);
                if (isRestricted(node.name)) {
                    node = appendText(node as vParent);
                    mode = RESTRICTED;
                } else if (isVoided(node.name)) {
                    node = node.parent;
                    mode = CHILDREN;
                } else {
                    mode = CHILDREN;
                }
            } else {
                c = String.fromCodePoint(c1);
                i += c.length - 1;
                node.name += c;
            }

        } else if (mode === TAG_CLOSE_NAME) {
            // if closed tag does not match tag
            // then close previous siblining with the close tag as text
            // handle the reset of everything as text unless match close tag found then close

            // if (isSpace(c1)) {
            //     continue;
            // } else
            if (isGreat(c1)) {
                if (isRestricted(node.name)) {
                    // throw new Error('not handled');
                    // node = node.parent;
                    // node = appendText(node as vRestricted);
                    // mode = TEXT;
                    // mode = RESTRICTED;
                    node = node.parent;
                    mode = CHILDREN;
                } else if (isVoided(node.name)) {
                    node = node.parent;
                    mode = CHILDREN;
                } else {
                    // if (node.name !== tagClose) {
                    //     console.warn(`tag close not found ${node.name} ${tagClose}`);
                    // }
                    node = node.parent;
                    mode = CHILDREN;
                }
                // tagClose = '';
            } else {
                // tagClose += c;
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
                i -= 1;
            } else if (isGreat(c1)) {
                events?.attribute(node as vAttribute);
                node = node.parent;
                mode = TAG_OPEN_NAME;
                i -= 1;
            } else if (isEqual(c1)) {
                mode = ATTRIBUTE_VALUE;
            } else {
                c = String.fromCodePoint(c1);
                i += c.length - 1;
                node.name += c;
            }

        } else if (mode === ATTRIBUTE_VALUE) {

            if (
                (node as vAttribute).value.startsWith('"') ||
                (node as vAttribute).value.startsWith('\'')
            ) {
                if ((node as vAttribute).value.codePointAt(0) === c1) {
                    (node as vAttribute).value = (node as vAttribute).value.slice(1);
                    events?.attribute(node as vAttribute);
                    node = node.parent;
                    mode = TAG_OPEN_NAME;
                } else {
                    c = String.fromCodePoint(c1);
                    i += c.length - 1;
                    (node as vAttribute).value += c;
                }
            } else if (isForward(c1) || isSpace(c1) && isSpace(c2)) {
                continue;
            } else if (isSpace(c1)) {
                events?.attribute(node as vAttribute);
                node = node.parent;
                mode = TAG_OPEN_NAME;
                i -= 1;
            } else if (isGreat(c1)) {
                events?.attribute(node as vAttribute);
                node = node.parent;
                mode = TAG_OPEN_NAME;
                i -= 1;

                // } else if (equal('{{')) {
                //     i++;
                //     appendAttributeValue(node as vElement, '{{');
                // } else if (equal('}}')) {
                //     i++;
                //     appendAttributeValue(node as vElement, '}}');
            } else {
                c = String.fromCodePoint(c1);
                i += c.length - 1;
                (node as vAttribute).value += c;
            }

        } else if (mode === TEXT) {

            if (isLess(c1)) {
                node = node.parent;
                mode = CHILDREN;
                i -= 1;
            } else if (isCurlOpen(c1) && isCurlOpen(c2)) {
                node = node.parent;
                node = appendText(node as vParent);
                (node as vText).data += '{{';
                i += 1;
            } else if (isCurlClose(c1) && isCurlClose(c2)) {
                (node as vText).data += '}}';
                node = node.parent;
                node = appendText(node as vParent);
                i += 1;
            } else {
                c = String.fromCodePoint(c1);
                i += c.length - 1;
                (node as vText).data += c;
            }

        } else if (mode === CDATA) {

            if (isSquareClose(c1) && isSquareClose(c2) && isGreat(c3)) { // ]]>
                node = node.parent;
                mode = CHILDREN;
                i += 2;
            } else {
                c = String.fromCodePoint(c1);
                i += c.length - 1;
                (node as vCdata).data += c;
            }

        } else if (mode === COMMENT) {

            if (isDash(c1) && isDash(c2) && isGreat(c3)) { // -->
                node = node.parent;
                mode = CHILDREN;
                i += 2;
            } else {
                c = String.fromCodePoint(c1);
                i += c.length - 1;
                (node as vComment).data += c;
            }

        } else if (mode === RESTRICTED) {

            if (
                isLess(c1) &&
                isForward(c2) &&
                data.substring(i + 2, i + 2 + node.parent.name.length).toLowerCase() === node.parent.name.toLowerCase()
            ) {

                // console.log(
                //     data.substring(i + 2, i + 2 + node.parent.name.length).toLowerCase(),
                //     node.parent.name.toLowerCase()
                // );

                node = node.parent;
                mode = CHILDREN;
                i += 2 + node.name.length;
            } else {
                c = String.fromCodePoint(c1);
                i += c.length - 1;
                (node as vText).data += c;
            }

        } else {
            throw new Error('parse mode not valid');
        }

    }

    return root;
};
