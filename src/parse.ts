
const isString = '\'`"';
const referenceSkips = ' ?]';
const referenceStart = '_$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const referenceInner = '._$0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

const referenceFirstSkips = `
$event $value $checked $form $e $v $c $f
window document console location this Math Date Number
true false null undefined NaN of in do if for
let new try var case else with await break catch
class const super throw while yield delete export
import return switch default extends finally continue
debugger function arguments typeof void
`;

const parse = function (data, rewrites) {

    let inString = false;
    let inSyntax = false;
    let inReference = false;
    let skipReference = false;

    let part = '';
    let first = '';
    let reference = '';

    let check = '';

    let has = false;
    const assignees = [];
    const references = [];

    let current, next, previous;

    console.log(data);

    for (let i = 0, l = data.length; i < l; i++) {

        current = data[ i ];
        next = data[ i + 1 ];
        previous = data[ i - 1 ];

        if (inString && first === current && previous !== '\\') {

            inString = false;
            first = '';

        } else if (!inString && isString.indexOf(current) !== -1) {

            inString = true;
            first = current;

            if (skipReference) {
                inReference = false;
                skipReference = false;
                reference = check = part = '';
                continue;
            }

            inReference = false;
            check = reference + part;
            if (check) {
                if (check === 'of' || check === 'in') {
                    references.length = 0;
                } else {
                    if (!reference.length && referenceFirstSkips.indexOf(part) !== -1) {
                        reference = check = part = '';
                    } else {
                        console.log(part);
                        if (rewrites && !reference.length) for (const [ name, value ] of rewrites) part === name ? part = value : null;
                        console.log(part);
                        reference += part;
                        references.push(reference);
                        reference = check = part = '';
                    }
                }
            }

        } else if (inString) {

            continue;

        } else if (!inSyntax && current === '{' && next === '{') {

            inSyntax = true;
            i++;

        } else if (inSyntax && current === '}' && next === '}') {

            has = true;
            inSyntax = false;

            if (skipReference) {
                inReference = false;
                skipReference = false;
                reference = check = part = '';
                continue;
            }

            inReference = false;
            check = reference + part;
            if (check) {
                if (check === 'of' || check === 'in') {
                    references.length = 0;
                } else {
                    if (!reference.length && referenceFirstSkips.indexOf(part) !== -1) {
                        reference = check = part = '';
                    } else {
                        console.log(part);
                        if (rewrites && !reference.length) for (const [ name, value ] of rewrites) part === name ? part = value : null;
                        console.log(part);
                        reference += part;
                        references.push(reference);
                        reference = check = part = '';
                    }
                }
            }

            i++;

        } else if (inSyntax) {

            if (inReference) {

                if (current === '.') {

                    if (!reference.length && referenceFirstSkips.indexOf(part) !== -1) {
                        skipReference = true;
                        part = '';
                    } else if (!skipReference) {
                        console.log(part);
                        if (rewrites && !reference.length) for (const [ name, value ] of rewrites) part === name ? part = value : null;
                        console.log(part);
                        reference += (current + part);
                        part = '';
                    }

                } else if (current === '[') {
                    // } else if (current === '[' || previous === ']') {

                    if (!reference.length && referenceFirstSkips.indexOf(part) !== -1) {
                        skipReference = true;
                        part = '';
                    } else if (!skipReference) {
                        console.log(part);
                        if (rewrites && !reference.length) for (const [ name, value ] of rewrites) part === name ? part = value : null;
                        console.log(part);
                        reference += ('.' + part);
                        part = '';
                    }

                    // for (const [ name, value ] of rewrites) part === name ? part = value : null;
                    // reference += ('.' + part);

                    // reference += '.';

                } else if (referenceInner.indexOf(current) !== -1) {

                    part += current;
                    // reference += current;

                } else if (referenceSkips.indexOf(current) !== -1) {

                    continue;

                } else if (current === '=' && next !== '=') {

                    if (skipReference) {
                        inReference = false;
                        skipReference = false;
                        reference = check = part = '';
                        continue;
                    }

                    inReference = false;
                    check = reference + part;
                    if (check) {
                        if (check === 'of' || check === 'in') {
                            references.length = 0;
                            reference = check = part = '';
                        } else {
                            if (!check.length && referenceFirstSkips.indexOf(part) !== -1) {
                                reference = check = part = '';
                            } else {
                                console.log(part);
                                if (rewrites && !reference.length) for (const [ name, value ] of rewrites) part === name ? part = value : null;
                                console.log(part);
                                reference += part;
                                assignees.push(reference);
                                reference = check = part = '';
                            }
                        }
                    }

                } else {

                    if (skipReference) {
                        inReference = false;
                        skipReference = false;
                        reference = check = part = '';
                        continue;
                    }

                    inReference = false;
                    check = reference + part;
                    if (check) {
                        if (check === 'of' || check === 'in') {
                            references.length = 0;
                            reference = check = part = '';
                        } else {
                            if (!check.length && referenceFirstSkips.indexOf(part) !== -1) {
                                reference = check = part = '';
                            } else {
                                console.log(part);
                                if (rewrites && !reference.length) for (const [ name, value ] of rewrites) part === name ? part = value : null;
                                console.log(part);
                                reference += part;
                                references.push(reference);
                                reference = check = part = '';
                            }
                        }
                    }

                }

            } else {

                if (referenceStart.indexOf(current) !== -1) {

                    inReference = true;
                    part += current;
                    // reference += current;

                }

            }

        }

    };

    console.log(has, references, assignees);

    return { has, references, assignees };
};

export default parse;