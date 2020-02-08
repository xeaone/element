
export default {
    title: 'Select Binder',
    name: 'r-binder-select',
    model: {
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
    template: /*html*/`

        <style>
            o-optgroup::before, o-options::before {
                font-weight: bold;
            }
            o-option {
                margin-left: 1rem;
            }
        </style>

        <h2 o-text="title"></h2>

        <!-- <hr>
        <div o-text="result.fruit"></div>
        <select o-value="result.fruit">
            <option value="apple">apple</option>
            <option value="pear">pear</option>
            <option value="peach" selected>peach</option>
        </select>

        <hr>
        <div o-text="result.state"></div>
        <select o-value="result.state">
            <option o-value="stateOne" o-text="stateOne"></option>
            <option o-value="stateTwo" o-text="stateTwo"></option>
        </select>

        <hr>
        <div o-text="result.cars"></div>
        <select o-value="result.cars" o-each-car="cars" multiple>
            <option o-value="car" o-text="car"></option>
        </select>

        <hr>
        <div>{{result.name}}</div>
        <o-select o-value="result.name" o-each-name="names">
            <o-option o-value="name">{{name}}</o-option>
        </o-select>

        <br>
        <hr>
        <div o-text="result.friends"></div>
        <br>
        <o-select o-value="result.friends" o-each-group="groups" multiple>
            <o-optgroup o-label="group" o-each-friend="friends" o-key="key" o-index="index">
                <o-option o-value="friend">
                    <div>{{key}}</div>
        			<div>{{index}}</div>
					<div>{{friend.name}}</div>
					<div o-text="friend.name"></div>
				</o-option>
			</o-optgroup>
		</o-select> -->

		<br>
		<hr>
		<div o-text="result.plants"></div>
		<br>
		<select o-value="result.plants" o-each-plant-i-k="plants">
		<!-- <select o-value="result.plants" o-each-plant-i-k="plants" multiple> -->
			<optgroup label="[k]" o-each-p="[plant]">
				<option o-value="[p].name">{{[p].name}}</option>
			</optgroup>
		</select>

		<br>
		<hr>
		<div o-text="result.plants"></div>
		<br>
		<o-select o-value="result.plants" o-each-plant-i-k="plants">
		<!-- <o-select o-value="result.plants" o-each-plant-i-k="plants" multiple> -->
			<o-optgroup label="[k]" o-each-p="[plant]">
				<o-option o-value="[p].name">
					<div>{{[p].name}}</div>
					<div o-text="[p].name"></div>
				</o-option>
			</o-optgroup>
		</o-select>

	`
};
