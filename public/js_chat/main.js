const socket = io();
const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('invitation'); //here  is where the roomname is taken from the user interaction with index.html file and reflects in chat.html
const userList = document.getElementById('users');
//Get username and room from url


const {username, invitation} = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});
socket.emit('joinRoom', {username, invitation});

//get room and users 
socket.on('roomUsers', ({room, users }) =>{
    outputRoomName(invitation);
    outputUsers(users);
})


//message from server
socket.on('message', message =>{
    console.log(message);
    outputMessage(message);

    //Scroll down action
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

//create an eventListener (message submit)
chatForm.addEventListener('submit', e => {
    e.preventDefault();
    const msg = e.target.elements.msg.value;

    //emit message to server
    socket.emit('chatMessage', msg);

    //clear user input 
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
});


//output message to dom
function outputMessage(message){
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `
    <p class="meta">${message.username} <span>${message.time}</span></p>
    <p class="text">
        ${message.text}
    </p>`;
    document.querySelector('.chat-messages').appendChild(div);
}

// add room name to dom
function outputRoomName(invitation){
    roomName.innerText = invitation;
}

//add users to DOM
function outputUsers(users){
    userList.innerHTML = `
        ${users.map(user => `<li>${user.username}</li>`).join('')}
    
    `;
}



document.getElementById('leave-btn').addEventListener('click', () => {
    const leaveRoom = confirm('Are you sure you want to leave the chatroom?');
    if (leaveRoom) {
      window.location = '../index.html';
    } else {
    }
});