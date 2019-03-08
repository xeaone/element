var title = 'Select';

export default {
	title: title,
	path: '/select',
	component: {
		name: 'r-select',
		model: {
			title: title,
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
			friends: [
				{ name: 'dave', age: 2 },
				{ name: 'sam', age: 40 }
			],
			result: {
				state: '',
				fruit: 'peach',
				name: '',
				cars: [],
				friends: []
			}
		},
		template: /*html*/`

			<h2 o-text="title"></h2>

			<hr>

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
				<option o-value="$car" o-text="$car"></option>
			</select>

			<hr>

			<div o-text="result.name"></div>
			<select o-value="result.name" o-each-name="names">
				<option o-value="$name" o-text="$name"></option>
			</select>

			<hr>

			<div o-text="result.friends"></div>
			<o-select o-value="result.friends" o-each-friend="friends" multiple>
				<o-option o-value="$friend">
					<div>{{$friend-key}}</div>
					<div>{{$friend-index}}</div>
					<div o-text="$friend.name"></div>
				</o-option>
			</o-select>

		`
	}
}

/*


*/
