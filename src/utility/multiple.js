
export default function multiple (element) {
    if (typeof element.multiple === 'boolean') {
        return element.multiple;
    } else {
        switch (element.getAttribute('multiple')) {
            case undefined: return false;
            case 'true': return true;
            case null: return false;
            case '': return true;
            default: return false;
        }
    }
}
