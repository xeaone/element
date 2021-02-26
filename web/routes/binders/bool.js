
export default class BinderBoolRoute extends Oxe.Component {

    title = 'Bool Binder'

    static model = {
        b: 'blue',
        c: 'red',
        hidden: false,
        toggleHidden() {
            console.log('toggleHidden');
            this.model.hidden = !this.model.hidden;
        }
    }

    static template = /*html*/`

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
