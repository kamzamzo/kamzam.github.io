const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Khởi tạo Express app và server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Kết nối tới cơ sở dữ liệu MongoDB
mongoose.connect('mongodb://localhost/chatApp', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Định nghĩa schema cho người dùng và tin nhắn
const userSchema = new mongoose.Schema({
    username: String,
    password: String
});
const User = mongoose.model('User', userSchema);

const messageSchema = new mongoose.Schema({
    username: String,
    message: String
});
const Message = mongoose.model('Message', messageSchema);

// Middleware để xử lý dữ liệu JSON
app.use(express.json());

// Đăng ký tài khoản người dùng
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.json({ message: 'User registered successfully' });
});

// Đăng nhập
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    if (!await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ message: 'Invalid password' });
    }
    const token = jwt.sign({ username: user.username }, 'secret_key');
    res.json({ token });
});

// Middleware để xác thực token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
        return res.sendStatus(401);
    }
    jwt.verify(token, 'secret_key', (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};

// Socket.io: Giao tiếp realtime
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

    socket.on('chat message', async (msg) => {
        const message = new Message({ username: socket.username, message: msg });
        await message.save();
        io.emit('chat message', msg);
    });

    socket.on('typing', () => {
        socket.broadcast.emit('typing', socket.username);
    });
});

// Khởi động máy chủ
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
