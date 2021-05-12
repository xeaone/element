
export default class BinderBoolRoute extends Oxe.Component {

    title = 'Bool Binder'

    data = {
        b: 'blue',
        c: 'red',
        hidden: false,
        toggleHidden() {
            console.log('toggleHidden');
            this.data.hidden = !this.data.hidden;
        }
    }

    html = /*html*/`

        <h2>Bool Binder</h2>
        <hr>

        <br>
        <br>
        <strong>hidden</strong>
        <br>
        <div hidden="{{hidden}}">hidden</div>
        <button onclick="{{toggleHidden}}">toggle hidden</button>

        <br>
        <br>

    `

}
