import Match from './match';

export default function Includes (items, item) {

    for (let i = 0; i < items.length; i++) {
        if (Match(items[i], item)) {
            return true;
        }
    }

    return false;
}
