
export default {
    title: 'Value Binder',
    name: 'r-binder-value',
    model: {
        text: 'Hello World'
    },
    template: /*html*/`

        <h2>Value Binder</h2>
        <hr>

        <div>{{text}}</div>
        <input o-value="text">


    `
}
