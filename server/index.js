const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());

// To track rooms and users
const rooms = {};

// Helper to extract YouTube video ID
const extractVideoId = (urlOrId) => {
  try {
    // Match either full URL or ID
    const match = urlOrId.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)?([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  } catch (e) {
    return null;
  }
};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);

    // Add user to room
    if (!rooms[roomId]) {
      rooms[roomId] = new Set();
    }
    rooms[roomId].add(socket.id);

    // Notify room of updated count
    io.to(roomId).emit('user-count', rooms[roomId].size);
  });

  socket.on('sync-action', ({ roomId, action }) => {
    socket.to(roomId).emit('receive-action', action);
  });

  socket.on('new-video', ({ roomId, videoId }) => {
    const cleanId = extractVideoId(videoId);
    if (cleanId) {
      io.to(roomId).emit('receive-action', { type: 'changeVideo', videoId: cleanId });
    } else {
      socket.emit('error', 'Invalid YouTube URL');
    }
  });

  socket.on('disconnecting', () => {
    const roomsUserWasIn = [...socket.rooms].filter(r => r !== socket.id);

    roomsUserWasIn.forEach(roomId => {
      if (rooms[roomId]) {
        rooms[roomId].delete(socket.id);
        if (rooms[roomId].size === 0) {
          delete rooms[roomId];
        } else {
          io.to(roomId).emit('user-count', rooms[roomId].size);
        }
      }
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = 4000;
server.listen(PORT, '0.0.0.0', () =>
  console.log(`Server running on http://192.168.29.117:${PORT}`)
);