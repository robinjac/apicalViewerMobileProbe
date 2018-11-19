const express = require('express'),
	app = express(),
	server = require('http').Server(app),
	io = require('socket.io')(server);

io.on('connection', function (socket) {

	socket.on('desktop connect', function (data) {
		socket.join(data.room);
		console.log('Desktop connected!');
	});

	socket.on('probe connect', function (data) {
		socket.join(data.room);
		socket.to(data.room).emit('probe connected');
		console.log('Probe connected!');
	});

	socket.on('update', function (data, room) {
		socket.to(room).emit('update orientation', data);
	});

	socket.on('disconnect', function () {
		// socket.to(Object.keys(io.sockets.adapter.rooms)[1]).emit('probe disconnected');
		console.log('device disconnected!');
	});

	socket.on('started sending', () => {
		socket.to(Object.keys(io.sockets.adapter.rooms)[1]).emit('started sending');
	});

	socket.on('stopped sending', () => {
		socket.to(Object.keys(io.sockets.adapter.rooms)[1]).emit('stopped sending');
	});

});

server.listen(8080, function () {
	console.log('Server Started On Port 8080');
});