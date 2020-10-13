const { Component } = Oxe;

export default class RouteBinderClass extends Component {

    title = 'Class Binder';

    static model = {

        title: 'Class',

        ca: false,
        toggle () { this.model.ca = !this.model.ca; },

        c: 'default',
        overwrite () { this.model.c = 'overwrite'; }

    };

    static style = /*css*/`
        .default {
            border: solid 0.3rem black;
        }
        .overwrite {
            border: solid 0.3rem red;
        }
        .active {
            background: lightgray;
        }
    `;

    static template = /*html*/`

        <h2>{{title}}</h2>
        <hr>

        <br>
        <br>

        <div class="{{c}}">o-class="{{c}}"</div>
        <button onclick="{{overwrite}}">Overwrite Class</button>

        <br>
        <br>

        <div class="default" class-active="{{ca}}">o-class-active="{{ca}}"</div>
        <button onclick="{{toggle}}">Toggle Class</button>


    `;

}
