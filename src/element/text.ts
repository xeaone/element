import format from './format';
import Binder from './binder';


export default class Text extends Binder {

    render () {
        const data = this.compute();
        this.node.nodeValue = format(data);
    }

    reset () {
        this.node.nodeValue = '';
    }

}
