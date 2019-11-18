import Match from './match.js';

export default function Index (items, item) {

    for (let i = 0; i < items.length; i++) {
        if (Match(items[i], item)) {
            return i;
        }
    }

    return -1;
}
