const express = require('express'),
	path = require('path'),
	app = express(),
	server = require('http').Server(app),
	io = require('socket.io')(server),
	ip = require('ip').address();
	
	app.use(express.static(path.join(__dirname, 'website')));
	
	io.on('connection', function(socket){
		
		socket.on('desktop connect', function(data){
			socket.join(data.room);
			socket.nsp.to(data.room).emit('ip',ip);
		});
		
		socket.on('probe connect', function(data){
			socket.join(data.room);
			socket.to(data.room).emit('probe connected')
		});
		
		socket.on('update movement', function(data, room){
			socket.to(room).emit('update position', data);
		});
		
		socket.on('disconnect', function(){
			socket.to(Object.keys(io.sockets.adapter.rooms)[1]).emit('probe disconnected');
		});
		
	});
	
	server.listen(8080, function(){
		console.log('Server Started On Port 8080');
	});