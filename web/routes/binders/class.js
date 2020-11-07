const { Component } = Oxe;

export default class RouteBinderClass extends Component {

    title = 'Class Binder';

    static model = {

        title: 'Class',

        t: false,
        toggle () { this.model.t = !this.model.t; },

        o: 'default',
        overwrite () { this.model.o = 'overwrite'; }

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

        <div class="{{c}}">class="{{c}}"</div>
        <button onclick="{{overwrite}}">Overwrite Class</button>

        <br>
        <br>

        <div class="default" class-active="{{ca}}">class="default" class-active="{{ca}}"</div>
        <button onclick="{{toggle}}">Toggle Class</button>


    `;

}
