// import Escape from './escape.js';

export default function Say (message) {

    if (message) {
        console.log(message);
    } else {
        window.alert('hello world from say');
    }

}
