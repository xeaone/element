
export default {
    name: 'o-scope',
    adopt: true,
    model: {
        title: 'Select',
        stateOne: 'AZ',
        stateTwo: 'FL',
        cars: [
            'Audi',
            'Saab',
            'Volvo'
        ],
        names: [
            'jon',
            'alex',
            'dave'
        ],
        groups: [
            'one',
            'two'
        ],
        friends: [
            { name: 'dave', age: 2 },
            { name: 'sam', age: 40 }
        ],
        plants: {
            flowers: [
                { name: 'rose' },
                { name: 'tulip' }
            ],
            trees: [
                { name: 'oak' },
                { name: 'aspen' }
            ]
        },
        result: {
            state: 'FL',
            fruit: '',
            name: '',
            cars: [],
            friends: [],
            plants: []
        }
    },
    template: '<slot></slot>'
};
