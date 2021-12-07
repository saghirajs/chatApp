const path = require('path');
const http = require('http');
const  express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users');


const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = 3000 || process.env.PORT;

botName = 'ChatCord Bot';

// Set static frontend folder
app.use(express.static(path.join(__dirname, 'public')));

// Run when client connects
io.on('connection', (socket) =>{

    socket.on('joinRoom', ({ username,room })=>{
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        socket.emit('message', formatMessage(username,'Welcome to chatcord!'));

        // Brodcast when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(username,`${user.username} has joined the chat`));
        
        // Send users and room info
        io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
        });
    });

    
    
    // Listen for chat message
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);
        
        io.to(user.room).emit('message',formatMessage(user.username, msg));
    });

    // Runs when client disconnects
    socket.on('disconnect', () => {
    const user = userLeave(socket.id);

        if(user) {
            io.to(user.room).emit('message', formatMessage(botName,`${user.username} has left the chat`));
        }

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
            });
    });

})


server.listen(port, () => console.log(`Listening on port ${port}!`));