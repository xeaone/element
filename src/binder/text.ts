import format from '../format';

const text = {
    async write (binder) {
        let data = await binder.compute();
        data = format(data);
        if (data === binder.target.textContent) return;
        binder.target.textContent = data;
    }
};

export default text;