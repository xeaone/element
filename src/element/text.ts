import format from './format.ts';
import Binder from './binder.ts';


export default class Text extends Binder {

    render () {
        const data = this.compute();
        this.node.nodeValue = format(data);
    }

    reset () {
        this.node.nodeValue = '';
    }

}
