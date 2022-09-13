// does not ignore arrow func params from being watched
// does not convert outside {{ }} to string any more

const aLower = 'a'.charCodeAt(0)-1;
const zLower = 'z'.charCodeAt(0)+1;
const aUpper = 'A'.charCodeAt(0)-1;
const zUpper = 'Z'.charCodeAt(0)+1;

const zero = '0'.charCodeAt(0)-1;
const nine = '9'.charCodeAt(0)+1;

const space = ' '.charCodeAt(0);
const money = '$'.charCodeAt(0);
const period = '.'.charCodeAt(0);
const question = '?'.charCodeAt(0);
const underscore = '_'.charCodeAt(0);

const and = '&'.charCodeAt(0);
const plus = '+'.charCodeAt(0);
const star = '*'.charCodeAt(0);
const pipe = '|'.charCodeAt(0);
const less = '<'.charCodeAt(0);
const equal = '='.charCodeAt(0);
const minus = '-'.charCodeAt(0);
const great = '>'.charCodeAt(0);
const carrot = '^'.charCodeAt(0);
const percent = '%'.charCodeAt(0);

const colon = ':'.charCodeAt(0);

const openCurley = '{'.charCodeAt(0);
const closeCurley = '}'.charCodeAt(0);

const tick = '`'.charCodeAt(0);
const back = '\\'.charCodeAt(0);
const double = '"'.charCodeAt(0);
const single = '\''.charCodeAt(0);
const forward = '/'.charCodeAt(0);

// const stringChar = [
//     '`','"',"'"
// ];

// const referenceEnd = [
//     ',','?',':','!','|',';','@','#','&','^','%','*','+','=','-','~','<','>','(',')','{','}','[',']'
// ];

// const referenceStart = [
//     'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
//     'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
//     '$','_'
// ];

// const referenceInner = [
//     'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
//     'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
//     '0','1','2','3','4','5','6','7','8','9',
//     '$','_','.'
// ];

const referenceIgnore = [
    '$context','$instance','$assign','$event','$value','$checked','$form','$e','$v','$c','$f',

    'this','arguments','true','false','null',

    'of','in','do','if','for','new','try','case','else','with', 'while', 'await', 'break','catch',
    'class','super','throw', 'yield','delete','export','import','return','switch','default',
    'extends','finally','continue','debugger','function','typeof','instanceof','void',

    'window',
    'undefined','NaN',
    'globalThis','self','document',
    'console','location','history','navigation','localStorage','sessionStorage',
    'Infinity','Math','Map','Set','Array','Object','String','RegExp',
    'isFinite','isNaN','parseFloat','parseInt','btoa','atob',
    'decodeURI','decodeURIComponent','encodeURI','encodeURIComponent',
];

export default function parse (data:string) {
    let code = '';

    let objectMode = 0;

    let assignmentMid = '';
    let assignmentLeft = '';
    let assignmentRight = '';
    let assignmentMode = 0;
    // let assignmentMode = false;

    let string = NaN;
    let stringMode = false;

    let reference = '';
    let referenceMode = false;
    const references: Array<string> = [];

    const length = data.length;
    for (let index = 0; index < length; index++) {
        const char = data[index];
        const c = data.charCodeAt(index);
        const l = data.charCodeAt(index-1);
        const n = data.charCodeAt(index+1);
        const nn = data.charCodeAt(index+2);
        const nnn = data.charCodeAt(index+3);

        if (!stringMode && !objectMode && c == openCurley && n == openCurley) {
            code += '(';
            index++;
            continue;
        }

        if (!stringMode && !objectMode && c == closeCurley && n == closeCurley) {

            // assignment end
            if (!assignmentRight) assignmentLeft = '';

            // reference end
            if (referenceMode){
                if (!referenceIgnore.includes(reference.split('.')[0])) references.push(reference);
                referenceMode = false;
                reference = '';
            }

            code += ')';
            index++;
            break;
        }

        code += char;

        // object property name end
        if (!stringMode && objectMode && c == colon) {
            reference = '';
            referenceMode = false;
        }

        // object mode start
        if (!stringMode && c == openCurley) {
            objectMode++;
        }

        // object mode end
        if (!stringMode && c == closeCurley) {
            objectMode--;
        }

        // assignment right collect
        if (assignmentMode) {
            assignmentRight += char;
        }

        // assignment start
        if (!stringMode && !assignmentMode &&
            c == equal && l != equal && n != equal && n != great
        ) {
            assignmentMode = 1;
            assignmentMid += char;
        }

        if (!stringMode && !assignmentMode &&
            c == and && n == equal ||
            c == pipe && n == equal ||
            c == star && n == equal ||
            c == plus && n == equal ||
            c == minus && n == equal ||
            c == carrot && n == equal ||
            c == percent && n == equal ||
            c == forward && n == equal
        ) {
            assignmentMode = 2;
            assignmentMid += String.fromCharCode(c, n);
        }

        if (!stringMode && !assignmentMode &&
            c == and && n == and && nn == equal ||
            c == pipe && n == pipe && nn == equal ||
            c == star && n == star && nn == equal ||
            c == less && n == less && nn == equal ||
            c == great && n == great && nn == equal ||
            c == question && n == question && nn == equal
        ) {
            assignmentMode = 3;
            assignmentMid += String.fromCharCode(c, n, nn);
        }

        if (!stringMode && !assignmentMode &&
            c == great && n == great && nn == great && nnn == equal
        ) {
            assignmentMode = 4;
            assignmentMid += String.fromCharCode(c, n, nn, nnn);
        }

        // assignment left collect
        if (!stringMode && !assignmentMode && !assignmentMid) {
            assignmentLeft += char;
        }

        // string end
        if (stringMode && c == string && l != back) {
            stringMode = false
            string = NaN;
            continue;
        }

        // string skip
        if (stringMode) {
            continue;
        }

        // string start
        if (c == tick || c == single || c == double){
            stringMode = true;
            string = c;
            continue;
        }

        // reference skip
        if (referenceMode && c == space) continue;
        if (referenceMode && c == question && n == period) continue;

        // reference collect
        if (referenceMode &&
            c > aLower && c < zLower ||
            c > aUpper && c < zUpper ||
            c > zero && c < nine ||
            c == money || c == underscore || c == period
        ) {
            reference += char;
            continue;
        }

        // reference end
        if (referenceMode && !(
            c > aLower && c < zLower ||
            c > aUpper && c < zUpper ||
            c > zero && c < nine ||
            c == money || c == underscore || c == period
        )) {
            if (!referenceIgnore.includes(reference.split('.')[0])) references.push(reference);
            referenceMode = false;
            reference = '';
            continue;
        }

        // reference start
        if (
            c > aLower && c < zLower ||
            c > aUpper && c < zUpper ||
            c == money || c == underscore
        ) {
            referenceMode = true;
            reference += char;
            continue;
        }

    }

    return { code, references, assignmentLeft, assignmentMid, assignmentRight };
}

// console.log(parse('{{foo= $value || "test" || last}}'));
// console.log(parse('{{hello.world}}'));
// console.log(parse('{{hello?.world}}'));
// console.log(parse('{{window.history}}'));
// console.log(parse('{{[a1,a2,3,4]}}'));
// console.log(parse('{{"string\\" escape"}}'));
// console.log(parse('{{fn(param1,param2)}}'));
// console.log(parse('{{ {o1,o2, o3 } }}'));
// console.log(parse('{{ {o1,o2, op3 : ov3 } }}'));