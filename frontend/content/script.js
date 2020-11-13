'use strict';

const e = React.createElement;

class LikeButton extends React.Component {
	constructor(props) {
		super(props);
		this.state = { liked: false };
	}

	render() {
		if( this.state.liked ) {
			return 'You liked this.';
		}
		return e(
			'button',
			{ onClick: () => this.setState({liked:true}) },
			'Like'
		);
	}
}



document.addEventListener( "DOMContentLoaded", function(event) {
	console.log( 'Initing...' );

	let div = document.createElement('div');
	div.className = 'blue';
	div.innerHTML = "<h2>Hello Javascript!!</h2>";
	document.body.append(div);

	console.log( 'Done!' );

	const domContainer = document.querySelector('#like_button_container');
	ReactDOM.render(e(LikeButton), domContainer);

	var ws = new WebSocket( 'ws://34.222.250.86:3000' );
	ws.addEventListener( 'open', function(event) {
		console.log( "WebSocket opened!" );
		//ws.onopen = function() { console.log( "Opened!" ); }
		//ws.onerror = function(error) { console.log( "Error!" ); }
		ws.send( 'Hellos!' );
	});
});
