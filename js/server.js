const path = require('path');
const http = require('http');
const socketio = require('socket.io'); 
const express = require('express');
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users');


const app = express();
const server = http.createServer(app);
const io = socketio(server);

//static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'Admin';

//run when client connects
io.on('connection', socket => { 
    console.log("over here");
    socket.on('/login', ({username, invitation }) => {


    const validInvite = "12345"; // modify this to read from database
    
    if (invitation !== validInvite) {
        socket.emit('errorMessage', 'Invalid invitation code');
        return;
    }


    const user = userJoin(socket.id, username, invitation);

    socket.join(user.room);
    //welcomes current user
    socket.emit('message', formatMessage(botName, 'Welcome to Planify Chat'));

    //broadcast when a user connects
    //notifies everyone except user that they have connected to the server
    socket.broadcast.to(user.room).emit(
        'message', 
        formatMessage(botName,`${user.username} has joined the chat`));
    
        //send useres and room info
    io.to(user.room).emit('roomUsers',{
        room: user.room,
        users: getRoomUsers(user.room)
    });
});
    // Listen for chatMessage
    socket.on('chatMessage', msg =>{
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    //runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        if(user){
            io.to(user.room).emit('message', formatMessage(botName,`${user.username} has left the chat`));
    
            //send useres and room info
            io.to(user.room).emit('roomUsers',{
                room: user.room,
                users: getRoomUsers(user.room)
            });
         }
    
    });
});

const PORT = 3000 || process.env.PORT;
server.listen(PORT, ()=> console.log(`Server running on Port ${PORT}`));