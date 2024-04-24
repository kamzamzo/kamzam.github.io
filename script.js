const socket = io();

let username;

function login() {
    const loginUsername = document.getElementById('login-username').value;
    const loginPassword = document.getElementById('login-password').value;
    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            localStorage.setItem('token', data.token);
            username = loginUsername;
            document.getElementById('login-container').style.display = 'none';
            document.getElementById('chat-container').style.display = 'block';
            initChat();
        } else {
            document.getElementById('login-message').innerText = data.message;
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    if (message !== '') {
        socket.emit('chat message', message);
        messageInput.value = '';
    }
}

function initChat() {
    socket.emit('typing');
    socket.on('typing', (username) => {
        document.getElementById('typing').innerText = `${username} is typing...`;
        setTimeout(() => {
            document.getElementById('typing').innerText = '';
        }, 2000);
    });

    socket.on('chat message', (msg) => {
        const messages = document.getElementById('messages');
        const messageElement = document.createElement('div');
        messageElement.innerText = msg;
        messages.appendChild(messageElement);
    });
}
