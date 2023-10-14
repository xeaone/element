import {
    isBang, isDash, isEqual, isForward, isGreater, isLeftSquareBracket, isLesser, isName, isSpace
} from './codes.ts';

import {
    ATTRIBUTE_NAME, ATTRIBUTE_VALUE,
    TAG, TEXT, BANG, CDATA, COMMENT, TEXTED_NAME,
    CHILDREN, TAG_OPEN_NAME, TAG_CLOSE_NAME,

    vText, vCdata, vChild, vParent, vElement, vComment, vDocument, vAttribute,

    isTexted, isVoided, appendText, appendCdata, appendComment, appendElement,
    appendAttribute, appendAttributeName, appendAttributeValue,
} from './tool.ts';

export default function parse (data: string) {
    const l = data.length;
    const root = new vDocument();

    let i = 0;
    let ii = 0;
    let ll = 0;
    let mode = CHILDREN;
    let attr: vAttribute | undefined;
    let node: vDocument | vChild = root;

    const equal = (part: string) => {
        for (ii = 0, ll = part.length; ii < ll; ii++) {
            if (data[ i + ii ] !== part[ ii ]) return false;
        }
        return true;
        //    data.substring(i, i + part.length) === part
    };

    let skip = 0;

    for (i; i < l; i++) {

        if (skip) {
            skip--;
            continue;
        }

        const c = data[ i ];
        const code = data.codePointAt(i) as number;

        if (mode === CHILDREN) {

            if (isLesser(code)) {
                mode = TAG;
            } else {
                node = appendText(node as vParent);
                node.data += c;
                mode = TEXT;
            }

        } else if (mode === BANG) {

            if (isLeftSquareBracket(code)) {
                node = appendCdata(node as vParent);
                mode = CDATA;
                skip = 6;
            } else if (isDash(code)) {
                node = appendComment(node as vParent);
                mode = COMMENT;
                skip = 1;
            } else {
                throw new Error('expected comment or cdata');
            }

        } else if (mode === TAG) {

            if (isSpace(code)) {
                continue;
            } else if (isForward(code)) {
                mode = TAG_CLOSE_NAME;
            } else if (isBang(code)) {
                mode = BANG;
            } else if (isGreater(code)) {
                if (isTexted(node.name)) {
                    node = appendText(node as vParent);
                    mode = TEXT;
                } else if (isVoided(node.name)) {
                    node = node.parent;
                    mode = CHILDREN;
                } else {
                    mode = CHILDREN;
                }
                // i++;
                // } else if (equal('<?')) {
                // i++;
                // } else if (equal('<!')) {
                // i++;
            } else {
                node = appendElement(node as vParent);
                node.name += c;
                mode = TAG_OPEN_NAME;
            }

        } else if (mode === TAG_OPEN_NAME) {

            if (isSpace(code)) {
                attr = appendAttribute(node as vElement, '');
                mode = ATTRIBUTE_NAME;
            } else if (isName(code)) {
                node.name += c;
            } else if (isForward(code)) {
                continue;
            } else if (isGreater(code)) {
                if (isTexted(node.name)) {
                    node = appendText(node as vParent);
                    mode = TEXT;
                } else if (isVoided(node.name)) {
                    node = node.parent;
                    mode = CHILDREN;
                } else {
                    mode = CHILDREN;
                }
            } else {
                throw new Error('expexted GreaterThan or Space');
            }

        } else if (mode === TAG_CLOSE_NAME) {

            if (isGreater(code)) {
                node = node.parent;
                mode = CHILDREN;
            } else {
                continue;
            }

        } else if (mode === ATTRIBUTE_NAME) {

            if (!attr) {
                throw new Error('expected attr');
            } else if (isSpace(code)) {
                attr = undefined;
                mode = TAG_OPEN_NAME;
            } else if (isForward(code)) {
                attr = undefined;
                mode = TAG_OPEN_NAME;
            } else if (isGreater(code)) {
                attr = undefined;
                if (isTexted(node.name)) {
                    node = appendText(node as vParent);
                    mode = TEXT;
                } else if (isVoided(node.name)) {
                    node = node.parent;
                    mode = CHILDREN;
                } else {
                    mode = CHILDREN;
                }
            } else if (isEqual(code)) {
                mode = ATTRIBUTE_VALUE;
            } else {
                // appendAttributeName(node as vElement, c);
                attr[ 0 ] += c;
            }

        } else if (mode === ATTRIBUTE_VALUE) {

            if (!attr) {
                throw new Error('expected attr');
            } else if (attr[ 1 ][ 0 ] === '"' || attr[ 1 ][ 0 ] === `'`) {
                if (attr[ 1 ][ 0 ] === c) {
                    attr[ 1 ] = attr[ 1 ].slice(1);
                    attr = undefined;
                    mode = TAG_OPEN_NAME;
                } else {
                    appendAttributeValue(node as vElement, c);
                }
            } else if (isSpace(code)) {
                attr = undefined;
                mode = TAG_OPEN_NAME;
            } else if (isForward(code)) {
                attr = undefined;
                mode = TAG_OPEN_NAME;
            } else if (isGreater(code)) {
                attr = undefined;
                mode = TAG_OPEN_NAME;
                console.log('here');
                // } else if (equal('{{')) {
                //     i++;
                //     appendAttributeValue(node as vElement, '{{');
                // } else if (equal('}}')) {
                //     i++;
                //     appendAttributeValue(node as vElement, '}}');
            } else {
                appendAttributeValue(node as vElement, c);
            }

        } else if (mode === TEXT) {

            if (isLesser(code)) {
                node = node.parent;
                mode = TAG;
                // } else if (equal('{{')) {
                //     i++;
                //     (node as vText).data += '{{';
                // } else if (equal('}}')) {
                //     i++;
                //     (node as vText).data += '}}';
            } else {
                (node as vText).data += c;
            }

        } else if (mode === TEXTED_NAME) {

            if (equal(`</${node.name}>`)) {
                skip = 1 + node.name.length;
                node = node.parent;
                mode = CHILDREN;
            } else {
                (node as vText).data += c;
            }

        } else if (mode === COMMENT) {

            if (equal('-->')) {
                skip = 2;
                node = node.parent;
                mode = CHILDREN;
            } else {
                (node as vComment).data += c;
            }

        } else if (mode === CDATA) {

            if (equal(']]>')) {
                skip = 2;
                node = node.parent;
                mode = CHILDREN;
            } else {
                (node as vCdata).data += c;
            }

        } else {
            throw new Error('parse mode not valid');
        }

    }

    return root;
};
