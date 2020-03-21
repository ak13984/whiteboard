var express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

io.on('connection', function (socket) {
    // console.log(socket.id);
socket.on('draw',function(obj){
    socket.broadcast.emit('drawforme',obj);
})
socket.on('topbar',function(coordinates){
    socket.broadcast.emit('movetopbar', coordinates);
})
socket.on('displaysticky',function(style){
    socket.broadcast.emit('showsticky',style);
})
socket.on('undo',function(obj){
    socket.broadcast.emit('drawafterundo');
})
});

app.use(express.static('client'));
const port=process.env.PORT;
server.listen(port, function () {
    console.log(`listening on *:${port}`);
});