const WebSocketServer = require('websocket').server;
const http = require('http');
const mysql = require('mysql2');

const mysqlConnection = mysql.createConnection({
	host: 'localhost',
	user: 'ketris_node_user',
	database: 'ketris_db',
	password: 'ketris_node_user_password'
});

function attempt_login ( inUsername, inPassword, connection, doApprove, doDeny ) {
  mysqlConnection.query(
    'SELECT * FROM ketris_users ' +
    'WHERE password_hash=UNHEX(MD5(\"' + inPassword + '\")) AND ' +
    'username_hash=UNHEX(MD5(\"'+inUsername+'\"));',
    function( error, results, fields ) {
      if( error ) { console.log( error ); }
      if( results.length > 0 ) {
        console.log( "Login of " + inUsername + " approved!" );
        doApprove( connection );
      } else {
        doDeny( connection );
      }
    }
  );
}

function does_username_exist( inUsername, inPassword, doCreateAccount ) {
  console.log( "does_username_exist" );
  mysqlConnection.query(
    'SELECT * FROM ketris_users ' +
    'WHERE username_hash=UNHEX(MD5(\"' + inUsername + '\"));',
    function( error, results, fields ) {
      if( error ) { console.log( error ); }
      if( results.length > 0 ) {
        console.log( "Username exists!" );
        return true;
      } else {
        console.log( "Username doesn't exist!" );
        doCreateAccount( inUsername, inPassword );
        return false;
      }
    }
  );
}

function create_user ( inUsername, inPassword ) {
  console.log( "create_user" );
  const username_unavailable = does_username_exist( inUsername, inPassword, ( inUsername, inPassword ) => {
    console.log( "Username available! Creating user..." );
    mysqlConnection.query(
      'INSERT INTO ketris_users ' +
      '(username_hash,password_hash,username_plaintext,account_creation) VALUES (' +
      'UNHEX(MD5(\"' + inUsername + '\")), ' +
      'UNHEX(MD5(\"' + inPassword + '\")), ' +
      '\"' + inUsername + '\", ' +
      '\'1999-01-01 01:01:01\' );',
      function( error, results, fields ) {
        if( error ) { console.log( error ); }
        console.log( "User created!" );
        return true; //TODO: Make this more robust.
      }
    );
  });
}

//const webSocketClient = require('websocket').client;
//const DB_Client = new webSocketClient();

const server = http.createServer( function(request, response) {
	console.log( "Recieved request." );
	response.writeHead(404);
	response.end();
});
server.listen( 3000, function() {
	console.log( "Listening on port 3000" );
});

wsServer = new WebSocketServer({
	httpServer: server
});


/*let db_backend;
DB_Client.on('connect', function(connection) {
  console.log( "Connected to mySQL backend!" );
  connection.sendUTF( JSON.stringify({
    type: "chat",
    event: "connection"
  }));
  db_backend = connection;
  //db_backend.sendUTF( "testing" );
});
DB_Client.connect('ws://localhost:8989/');*/


const users = [];
const games = [];

class unique_id_generator {
    constructor() {
      this.UIDs = [];
    }
    generate_uid( inField ) {
      console.log( "Generating first UID of field " + inField + "." );
      if( !this.UIDs[inField] ) {
        this.UIDs[inField] = {
        counter: 1,
        retiredIDs : []
      };
      return 0;
    } else if( this.UIDs[inField].retiredIDs.length > 0 ) {
      console.log( "Issuing retired UID of field " + inField + "." );
      return this.UIDs[inField].retiredIDs.pop();
    } else {
      console.log( "Generating new UID of field " + inField + "." );
      return this.UIDs[inField].counter++;
    }
  }
  retireUID( inField, inUID ) {
    console.log( "reitiring UID " + inUID + " of " + inField );
    this.UIDs[inField].retiredIDs.push( inUID );
  }
}


function send_MessageToAll( in_message ) {
  users.forEach( user=> {
    if( Object.keys( user ).length != 0 ) {
      user.connection.send( JSON.stringify( in_message ) );
    }
  });
}

function send_MessageToAllExcept( in_message, except_id ) {
  users.forEach( user=>{
    if( Object.keys( user ).length != 0 && user.user_id != except_id ) {
      user.connection.send( JSON.stringify( in_message ) );
    }

  });
}

function send_MessageToUser( in_message, in_user_id ) {
  users[in_user_id].connection.send( JSON.stringify( in_message ) );
}

/*
Used to ensure that each user will have a unqiue name.
Will be replaced with RDBM check.
*/
function doesUsernameExist( in_username ) {
	users.forEach( user => {
		if( Object.keys(user).length != 0 &&user.username == in_username ) {
			return true;
		}
	});
	return false;
}

function send_NewUserNotification( in_user_id ) {
	console.log( "Sending new user notification to all logged-in clients." );
	const newUser = {
		type: "chat_event",
		event: "server_new_user",
		username: users[in_user_id].username
	};
	const out = JSON.stringify( newUser );
	console.dir( newUser );
	users.forEach( user => {
		if( Object.keys(user).length != 0 ) {
			if( user.user_id != in_user_id ) {
				user.connection.send( out );
			}
		}
	});
}


/*
This is sent to new users, to give them a full list of connected users.
*/
function send_UserList( conn ) {
	console.log( "Sending UserList" );
	const userList = [];
	users.forEach( user=> {
		if( Object.keys(user).length != 0 ) {
			userList.push({
				username: user.username
			});
		}
	});
	console.dir( userList );
	const out = {
		type: "chat_event",
		event : "server_user_list",
		user_list : userList
	}
	conn.sendUTF( JSON.stringify( out ) );
}


/*
This is sent to new users, to give them a full list of listed games.
*/
function send_GameList(conn) {
	const avail_gamesList = [];
	games.forEach( game=> {
		if( Object.keys(game).length != 0 && game.is_listed == true ) {
			avail_gamesList.push({
				game_name: game.game_name,
				game_id: game.game_id
			});
		}
	});
	const out = {
		type: "chat_event",
		event: "server_game_list",
		game_list : avail_gamesList
	}
	conn.sendUTF( JSON.stringify( out ) );
}


/*
This sends a full list of connected users and listed games to new users.
*/
function send_Lists(conn) {
	send_UserList(conn);
	send_GameList(conn);
}


/*
This is sent to all users to notify them that a user has disconnected.
*/
function send_LogoutUserNotification( inUsername ) {
	const oldUser = {
		type: "chat_event",
		event: "server_remove_user",
		username: inUsername
	};
	const out = JSON.stringify( oldUser );
	users.forEach( user => {
		if( Object.keys(user).length != 0 ) {
			user.connection.send( out );
		}
	});
}


/*
Deletes game serverside.
*/
function remove_game( in_game_id ) {
  console.log( "remove_game " + in_game_id );

  //If game is listed, send delisting to all connected users.
  if( games[ in_game_id ].is_listed == true ) {
    send_delist_game( in_game_id );
  }

  //Delete game.
  games[ in_game_id ] = {};
  myUIDGen.retireUID( "games", in_game_id );
}


/*
This is sent to all connected users to notify them that a game is no longer available.
*/
function send_delist_game( in_game_id ) {
	send_MessageToAll( {
		type: "chat_event",
		event: "server_delist_game",
		game_id: in_game_id
	});
}


/*
This is sent to all connected users to notify them that a game is available.
*/
function send_list_game( in_starting_user_id, in_starting_username, in_game_id, in_game_name ) {
	send_MessageToAllExcept(
		{
			type: "chat_event",
			event: "server_list_game",
			game_id: in_game_id,
			starting_user: in_starting_username,
			game_name: in_starting_username //placeholder
		},
		in_starting_user_id
	);
}


function send_launch_game( in_game_id ) {
	const message = {
		type: "chat_event",
		event: "server_enter_game",
		game_id: in_game_id
	};
	//const message_json = JSON.stringify( message_object );
	console.log( "send_launch_game" );
	console.log( games[in_game_id].game_name );
	send_MessageToUser( message, games[in_game_id].posting_user_id );
	send_MessageToUser( message, games[in_game_id].accepting_user_id );
}

const myUIDGen = new unique_id_generator;

wsServer.on('request', function(request) {
	//console.dir( request );

	var myConnection = request.accept( null, request.origin );
	console.log( "New connection!" );

	const new_user = {
		connection : myConnection,
		username : "unlogged",
		password : "unlogged",
		isLogged : false,
		user_id : -1
	}

	myConnection.on('message', function( message ) {
		console.log( "Recieved message!" );
		const inMessage = JSON.parse( message.utf8Data );
		console.dir( inMessage );
		if( inMessage.event === "client_login" ) {
			console.log( "Attempting login!" );
			attempt_login( inMessage.username, inMessage.password, myConnection,
				(myConnection) => {
					console.log( "Login approved!" );
					new_user.username = inMessage.username;
					new_user.password = inMessage.password;
					new_user.user_id = myUIDGen.generate_uid( "users" );
					new_user.has_game = false;
					new_user.game_id = -1;
					users[new_user.user_id] = new_user;
					myConnection.sendUTF( "server_login_approved" );
					send_Lists( myConnection );
					send_NewUserNotification( new_user.user_id );
				},
				(myConnection) => {
					console.log( "Login denied!" );
					myConnection.sendUTF( "login_rejected" );
				}
			);
/*			if( attempt_login( inMessage.username, inMessage.password ) == true ) {
				console.log( "Login approved!" );
				new_user.username = inMessage.username;
				new_user.password = inMessage.password;
				new_user.user_id = myUIDGen.generate_uid( "users" );
				new_user.has_game = false;
				new_user.game_id = -1;
				users[new_user.user_id] = new_user;

				myConnection.sendUTF( "server_login_approved" );
				send_Lists( myConnection );
				send_NewUserNotification( new_user.user_id );
			} else {
				console.log( "Login denied!" );
				myConnection.sendUTF( "login_rejected" );
			}*/
/*			if( doesUsernameExist( inMessage.username ) == false ) {
				console.log( "Login approved!" );

			} else {
				myConnection.sendUTF( "login_rejected" );
			}*/
		} else if( inMessage.event === "client_account_creation" ) {
			console.log( "Attempting to create account!" );
			if( create_user( inMessage.username, inMessage.password ) == true ) {
				myConnection.sendUTF( "account_creation_approve" );
			} else {
				myConnection.sendUTF( "account_creation_disapprove" );
			}
		} else if( inMessage.event === "client_chat_message" ) {
			const chat_message = {
				type: "chat_event",
				username : new_user.username,
				userdata : "placeholder",
				text : inMessage.text,
				event: "server_chat_message"
			}
			const chat_message_string = JSON.stringify( chat_message );
			users.forEach( user => {
				if( Object.keys( user ).length != 0 ) {
					user.connection.sendUTF( chat_message_string );
				}
			});
		} else if( inMessage.event === "client_new_game" ) {
			console.log( "New game" );

			//Add game to available games.
			const new_game = {
				game_name: new_user.username,
				game_id: myUIDGen.generate_uid( "games" ),
				is_listed: true,
				posting_user_id: new_user.user_id
			}
			games[ new_game.game_id ] = new_game;

			//Add game_id to current user.
			users[ new_user.user_id ].game_id = new_game.game_id;
			users[ new_user.user_id ].has_game = true;

			//Send list event to connected users.
			send_list_game(
				new_user.user_id,
				users[new_user.user_id].username,
				new_game.game_id,
				users[new_user.user_id].username
			);
		} else if( inMessage.event === "client_enter_game" ) {
			console.log( "enter_game" );
			console.log( "game_id: " + inMessage.game_id );

			//Make sure accepting user doesn't have a game posted.
			if( users[ new_user.user_id ].has_game == true ) {
				send_delist_game( users[new_user.user_id].game_id );
				remove_game( users[new_user.user_id].game_id );
			}

			//Mark game as no longer listed.
			games[ inMessage.game_id ].is_listed = false;

			//Add second user to game
			games[ inMessage.game_id ].accepting_user_id = new_user.user_id;

			//Add game_id to both users.
			users[ games[inMessage.game_id].accepting_user_id ].has_game = true;
			users[ games[inMessage.game_id].accepting_user_id ].game_id = inMessage.game_id;

			//Update user profile to reflect that game is delisted.
			users[ games[inMessage.game_id].posting_user_id ].has_listed_game = false;

			//Send notice to all users that game has been delisted.
			send_delist_game( inMessage.game_id );

			//Send message to both participants that Ketris should be launched.
			send_launch_game( inMessage.game_id );
		} else if( inMessage.event === "client_completed_game" ) {
			console.log( "Game completed." );
			remove_game( inMessage.game_id );
		} else {
			console.log( "Unrecognized object!" );
			console.dir( inMessage );
		}
	});
	myConnection.on( 'close', function( reasonCode, desc ) {
		console.log( "Closed connection!" );

		//If user hasn't logged in yet simply return.
		if( new_user.user_id == -1 ) {
			return;
		}

		//Send notice to all users that this user has disconencted.
		if( users[ new_user.user_id ].username != "unlogged" ) {
			console.log( "Logging out username: " + users[ new_user.user_id ].username );
			send_LogoutUserNotification( users[ new_user.user_id ].username );

			//Delete game.
			if( users[ new_user.user_id ].has_game == true ) {
				console.log( "Removing game." );
				remove_game( new_user.game_id );
			}
		}

		//Delete user.
		users[new_user.user_id] = {};
	});
});
