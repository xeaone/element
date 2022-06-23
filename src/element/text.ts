import format from './format.ts';
import Binder from './binder.ts';


export default class Text extends Binder {

    render () {
        const data = this.compute();
        this.owner.textContent = format(data);
    }

    reset () {
        this.owner.textContent = '';
    }

}
