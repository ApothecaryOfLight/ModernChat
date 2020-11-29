"use strict";
process.title = 'node-ketrisvs';
var myPort = 1337;
var webSocketServer = require('websocket').server;
var http = require('http');
var myClients = {};
var myButtons = [];

let myGames = [];

var fs = require('fs')
console.file_log = function( inMsg ) {
  fs.appendFile("/tmp/Ketris_VS_log.log", inMsg+"\n", (error)=> {
	if( error ) throw error;
	console.log( "Log write." );
  });
}

var server = http.createServer( function( request, response ) {  } );
server.listen( myPort, function() {
	console.log( "@:" + (new Date()) +
		" Server listening on port " + myPort );
});
var wsServer = new webSocketServer({
	httpServer: server
});

function sendToEnemy( inGameID, inMyConnection, inMessage ) {
	myGames[inGameID].forEach( user => {
		if( user != inMyConnection ) {
			user.send( inMessage );
		}
	});
}

wsServer.on('request', function(request) {
	console.log(
		(new Date()) + ' Connection from origin '
		+ request.origin + '.'
	);
	var connection = request.accept( null, request.origin ); 
	let game_id = -1;
	//var userName = false;
	//console.log( userName );
	console.log( (new Date()) + ' Connection accepted.' );
	connection.on( 'message', function( message ) {
		var json = JSON.parse( message.utf8Data );
		console.log( "Recieved message." );
		console.dir( json );
		if( json.event === "new_shape" ) {
			console.log( "New Shape");
			console.log( json.Shape + "/" + json.Color );
			var out = JSON.stringify(
				{
					type: 'game_event',
					event: 'new_shape',
					//author: userName,
					Shape: json.Shape,
					Rotation: json.Rotation,
					Color: json.Color,
					XPos: json.XPos,
					YPos: json.YPos,
					Timestamp: json.Timestamp
				}
			);
			sendToEnemy( game_id, connection, out );
			/*myClients[ myClients[userName].myEnemy ].
				myConnection.send( out );*/
		} else if( json.event === "movement" ) {
			console.log( "Movement");
			var out = JSON.stringify(
				{
					type: 'game_event',
					event: 'movement',
					direction: json.direction
				}
			);
			sendToEnemy( game_id, connection, out );
/*			myClients[ myClients[userName].myEnemy ].
				myConnection.send( out );*/
		} else if( json.event === "score" ) {
			console.log( "Score" );
			var out = JSON.stringify(
				{
					type: 'game_event',
					event: 'score',
					score: json.score
				}
			);
			sendToEnemy( game_id, connection, out );
/*			myClients[ myClients[userName].myEnemy ].
				myConnection.send( out );*/
		} else if( json.event === "collision" ) {
			console.log( "Collision");
			var out = JSON.stringify(
				{
					type: 'game_event',
					event: 'collision',
					//author: userName,
					Shape: json.Shape,
					Rotation: json.Rotation,
					Color: json.Color,
					XPos: json.XPos,
					YPos: json.YPos,
					Timestamp: json.Timestamp
				}
			);
			sendToEnemy( game_id, connection, out );
/*			myClients[ myClients[userName].myEnemy ].
				myConnection.send( out );*/
		} else if( json.event === "rotation" ) {
			console.log( "Rotation" );
			var out = JSON.stringify( 
				{
					type: 'game_event',
					event: 'rotation',
					rotation: json.rotation
				}
			);
			sendToEnemy( game_id, connection, out );
/*			myClients[ myClients[userName].myEnemy ].
				myConnection.send( out );*/
		} else if( json.event === "pause" ) {
			console.log( "pause" );
			var out = JSON.stringify( 
				{
					type: 'game_event',
					event: 'pause'
				}
			);
			sendToEnemy( game_id, connection, out );
/*			myClients[ myClients[userName].myEnemy ].
				myConnection.send( out );*/

		} else if( json.event === "unpause" ) {
			console.log( "unpause" );
			var out = JSON.stringify( 
				{
					type: 'game_event',
					event: 'unpause'
				}
			);
			sendToEnemy( game_id, connection, out );
/*			myClients[ myClients[userName].myEnemy ].
				myConnection.send( out );*/

		} else if( json.event === "freeze" ) {
			console.log( "freeze" );
			var out = JSON.stringify( 
				{
					type: 'game_event',
					event: 'freeze'
				}
			);
			sendToEnemy( game_id, connection, out );
/*			myClients[ myClients[userName].myEnemy ].
				myConnection.send( out );*/

		} else if( json.event === "unfreeze" ) {
			console.log( "unfreeze" );
			var out = JSON.stringify( 
				{ type: 'game_event',
				event: 'unfreeze'
			} );
			sendToEnemy( game_id, connection, out );
/*			myClients[ myClients[userName].myEnemy ].
				myConnection.send( out );*/

		} else if( json.event === "restart" ) {
			console.log( "Restart" );
			var out = JSON.stringify(
				{
					type:'game_event',
					event: 'restart'
				}
			);
			sendToEnemy( game_id, connection, out );
/*			myClients[ myClients[userName].myEnemy ].
				myConnection.send( restart );*/
		} else if( json.event === "start_ketris" ) {
			console.log( "Logging a start_ketris" );
			game_id = json.game_id;
			if( !myGames[json.game_id] ) {
				myGames[json.game_id] = [];
			}
			myGames[json.game_id].push( connection );
			//TODO: Send approval packet to make sure both connections are in myGames
			if( myGames[json.game_id].length == 2 ) {
				console.log( "Starting match." );
				myGames[json.game_id].forEach( game => {
					game.send( JSON.stringify({
						type: 'game_event',
						event: 'commence_gameplay'
					}));
				});
			}
		}
			/*for( var myUserKey in myClients ) {
				if( myUserKey == userName ) {
					console.log(
						"Sending start_game to client 1"
					);
					myClients[myUserKey].myEnemy = json.target;
					myClients[myUserKey].myConnection.
						sendUTF( packet_start_game );
				} else if( myUserKey == json.target ) {
					console.log(
						"Sending start_game to client 2"
					);
					myClients[myUserKey].myEnemy = userName;
					myClients[myUserKey].myConnection.
						sendUTF( packet_start_game );
				} else {
					var remove_game = JSON.stringify(
						{
							type:'event',
							event: "remove_game",
							participantA: userName,
							participantB: json.target
						}
					);
					myClients[myUserKey].myConnection.
						sendUTF( remove_game );
				}
			}
		} else if( json.event === "end_game" ) {
			var end_game = JSON.stringify(
				{
					type: 'event',
					event: 'end_game'
				}
			);
			myClients[ myClients[userName].myEnemy ].
				myConnection.send( end_game );
		}*/
	});
	/*connection.on('close', function(connection) {
		if (userName !== false ) {
			console.log((new Date()) + " Peer disconnected." );

			if(myClients[ myClients[userName].myEnemy ] != undefined ) {
				console.log(
					"Logging out : " +
					myClients[userName].myEnemy
				);
				var end_game = JSON.stringify(
					{
						type: 'end_game_interface',
						event: 'dc'
					}
				);
				myClients[ myClients[userName].myEnemy ].
					myConnection.send( end_game );
			}
			delete myClients[userName];
			myButtons.splice( myButtons.indexOf( userName ), 1 );
			var remove_user = JSON.stringify(
				{
					type:'logout',
					event: 'logout',
					logoutee: userName
				}
			);
			for( var myUserKey in myClients ) {
				myClients[myUserKey].
					myConnection.sendUTF( remove_user );
			}
		}
	});*/
	//TODO: Write new connection.on close
});
