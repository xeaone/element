import Update from '../update.js';

export default function (event) {
    if (event.target.hasAttribute('o-value')) {
        const update = Update(event.target, 'o-value');
        Promise.resolve(update);
    }
}
