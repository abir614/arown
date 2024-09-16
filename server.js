const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const app = express();
const PORT = process.env.PORT || 8080;

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

app.use(bodyParser.json());
app.use(express.static('public')); // For serving static files like HTML, CSS, JS
app.use('/uploads', express.static('uploads')); // For serving uploaded files

let chatRooms = {};  // To store chat rooms and messages
let usersTyping = {}; // To store typing status

// Create or join chat room with a code
app.post('/join', (req, res) => {
  const { roomCode, username } = req.body;
  if (!chatRooms[roomCode]) {
    chatRooms[roomCode] = [];
  }
  res.json({ success: true });
});

// Send a message to a chat room
app.post('/sendMessage', upload.single('image'), (req, res) => {
  const { roomCode, username, message } = req.body;
  if (chatRooms[roomCode]) {
    const messageObj = {
      id: uuidv4(),
      username,
      message,
      timestamp: new Date(),
      image: req.file ? `/uploads/${req.file.filename}` : null // Save image URL if it exists
    };
    chatRooms[roomCode].push(messageObj);
    res.json({ success: true, message: messageObj });
  } else {
    res.status(404).json({ success: false, error: 'Room not found' });
  }
});

// Get chat messages
app.get('/getMessages/:roomCode', (req, res) => {
  const roomCode = req.params.roomCode;
  res.json({ success: true, messages: chatRooms[roomCode] || [] });
});

// Typing status
app.post('/typing', (req, res) => {
  const { roomCode, username, isTyping } = req.body;
  usersTyping[roomCode] = usersTyping[roomCode] || {};
  usersTyping[roomCode][username] = isTyping;
  res.json({ success: true });
});

// Get typing status
app.get('/typingStatus/:roomCode', (req, res) => {
  const roomCode = req.params.roomCode;
  res.json({ success: true, typingUsers: usersTyping[roomCode] || {} });
});

app.listen(PORT, () => {
  console.log(`Server running`);
});

