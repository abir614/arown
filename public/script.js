const roomCode = prompt("Enter chat room code:"); // Ask user to enter a room code
const username = prompt("Enter your username:");

let isTyping = false;
let typingTimeout;

document.getElementById('room-name').textContent = roomCode;

document.getElementById("send-btn").addEventListener("click", sendMessage);
document.getElementById("message-input").addEventListener("input", handleTyping);

// Handle image file input and preview
document.getElementById('image-input').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const imagePreview = document.getElementById('image-preview');
      imagePreview.src = e.target.result;
      imagePreview.style.display = 'block'; // Show the preview
    }
    reader.readAsDataURL(file);
  } else {
    document.getElementById('image-preview').style.display = 'none'; // Hide the preview if no file selected
  }
});

async function joinRoom() {
  const response = await fetch('/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomCode, username })
  });
  if (response.ok) {
    loadMessages();
    listenForTyping();
    pollForMessages();
  }
}

async function sendMessage() {
  const messageInput = document.getElementById("message-input");
  const imageInput = document.getElementById("image-input");
  const message = messageInput.value.trim();
  const file = imageInput.files[0];

  if (message || file) {
    const formData = new FormData();
    formData.append('roomCode', roomCode);
    formData.append('username', username);
    formData.append('message', message);
    if (file) {
      formData.append('image', file);
    }

    await fetch('/sendMessage', {
      method: 'POST',
      body: formData
    });

    messageInput.value = '';
    imageInput.value = ''; // Clear the file input
    document.getElementById('image-preview').style.display = 'none'; // Hide the preview
    loadMessages();
    isTyping = false;
    notifyTyping(false);
  }
}

async function loadMessages() {
  const response = await fetch(`/getMessages/${roomCode}`);
  const { messages } = await response.json();
  const chatBox = document.getElementById("chat-box");
  chatBox.innerHTML = ''; // Clear previous messages
  messages.forEach(msg => {
    const messageEl = document.createElement('div');
    messageEl.classList.add('message');
    if (msg.username === username) messageEl.classList.add('self');

    if (msg.image) {
      const img = document.createElement('img');
      img.classList.add('message-image');
      img.src = msg.image; // Set the image source
      messageEl.appendChild(img);
    }

    if (msg.message) {
      const text = document.createElement('div');
      text.textContent = msg.message;
      messageEl.appendChild(text);
    }

    chatBox.appendChild(messageEl);
  });
  chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to bottom of the chat
}

async function pollForMessages() {
  setInterval(async () => {
    await loadMessages();
  }, 1000); // Poll every second to get new messages
}

function handleTyping() {
  if (!isTyping) {
    isTyping = true;
    notifyTyping(true);
  }
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    isTyping = false;
    notifyTyping(false);
  }, 1000); // Stop typing after 1 second of inactivity
}

async function notifyTyping(isTyping) {
  await fetch('/typing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomCode, username, isTyping })
  });
}

async function listenForTyping() {
  setInterval(async () => {
    const response = await fetch(`/typingStatus/${roomCode}`);
    const { typingUsers } = await response.json();
    const typingIndicator = document.getElementById("typing-indicator");
    const typingUsernames = Object.keys(typingUsers).filter(user => typingUsers[user] && user !== username);
    if (typingUsernames.length > 0) {
      typingIndicator.textContent = `${typingUsernames.join(', ')} is typing...`;
    } else {
      typingIndicator.textContent = '';
    }
  }, 500); // Check typing status every 500ms
}

// Initialize
joinRoom();

