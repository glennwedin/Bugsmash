//Socket io shit

var http = require('http');
var app = http.createServer();
var io = require('socket.io')(app);
var connection = require('../tools/mysql');

app.listen(8005);


///var sockets = [];
var chatters = [];
var rooms = [];
io.on('connection', function (socket) {
	///sockets.push(socket);

	socket.on('bugcreated', function (id) {
	
		connection.query('SELECT \
			`bugs`.*, \
			(SELECT `status` FROM `status` WHERE `id` = `bugs`.`status`) AS `statustext`,\
			(SELECT `priority` FROM `priority` WHERE `id` = `bugs`.`priority`) AS `prioritytext`,\
			(SELECT `users_id` FROM `users_bugs` WHERE `bugs_id` = `bugs`.`id`) AS `userid` \
			 FROM `bugs` WHERE `id` = '+connection.escape(id), function(err, rows, fields) {
			if (err) throw err;
			var json = [];
			if(rows.length > 0) {
				io.emit('bug', rows[0]);
			}
		});
	});
	
	socket.on('commentcreated', function (id) {
			connection.query('SELECT `comments`.*, (SELECT `name` FROM `users` WHERE `id` = `users_id`) AS `user` FROM `comments` WHERE `id` = '+connection.escape(id), function(err, rows, fields) {
			if (err) throw err;
			var json = [];
			if(rows.length > 0) {
				io.emit('comment', rows[0]);
			}
		});
	});

	socket.on('notify', function (data) {
		//Insert and get created-timestamp and primary-id
		connection.query('INSERT INTO `notifications` (`users_id`, `read`, `title`, `notification`, `url`) VALUES ('+connection.escape(data.users_id)+', 0, '+connection.escape(data.title)+', '+connection.escape(data.notification)+', '+connection.escape(data.url)+')', function (err, info) {
			if(err) throw err;
			var len = chatters.length;
			while(len--) {
				data.id = info.insertId;
				if(chatters[len].userid == data.users_id) {
					io.sockets.connected[chatters[len].sockid].emit('notification', data);
					//console.log(chatters[len])
				}
			}
			//socket.emit('notification', data);
		});
		
	});

	socket.on('currentUsersOnChat', function () {
		socket.emit('currentUsers', chatters);
	});

	socket.on('userJoinChat', function (user) {
		var len = chatters.length;
		while(len--) {
			if(chatters[len].userid == user.id) {
				return false;
			}
		}

		chatters.push({userid: user.id, data: {user: user}, sockid: socket.id});
	//	console.log(chatters);
		io.emit('userAdded', user);
	});

	socket.on('userLeaveChat', function (user) {
		var len = chatters.length;
		while(len--) {
			if(chatters[len].userid == user.id) {
				//Fjern user
				chatters.splice(len, 1);
				io.emit('userRemoved', user)
			}
		}
	});
	
	socket.on('chatmessage', function (message) {
		var len = chatters.length;
		
		//Lagre melding til mysql
		connection.query('INSERT INTO `message` (`message`, `from`) VALUES('+connection.escape(message.value)+', '+connection.escape(message.from)+')', function (err, info) {
			if(err) throw err;
			var insertId = info.insertId;
			connection.query('INSERT INTO `user_message` (`user_id`, `message_id`) VALUES ('+connection.escape(message.to)+', '+connection.escape(insertId)+')', function (err, info) {
				if(err) throw err;

				while(len--) {
					//in array
					if(chatters[len].userid == message.to) {
						io.sockets.connected[chatters[len].sockid].emit('recieve', message);
						//console.log(chatters[len])
					}
					/*
					if(chatters[len].userid == message.from) {
						io.sockets.connected[chatters[len].sockid].emit('recieve', message);
						//console.log(chatters[len])
					}*/
				}
			});
		});
		
		
		
	});
});

io.on('disconnect', function () {
	console.log('Dude disconnected');
});

module.exports = io;