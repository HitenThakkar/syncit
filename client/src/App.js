import './App.css';
import React, { useState, useEffect } from 'react';
import { socket, SocketContext } from './SocketContext';
import YouTubePlayer from './YoutubePlayer';

function App() {
  const [roomId, setRoomId] = useState('');
  const [joined, setJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [clientCount, setClientCount] = useState(1);

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8);
    socket.emit("join-room", newRoomId);
    setRoomId(newRoomId);
    setJoined(true);
    setIsHost(true);
  };

  const handleJoinRoom = () => {
    if (roomId.trim() !== '') {
      socket.emit("join-room", roomId);
      setJoined(true);
      setIsHost(false);
    }
  };

  const extractVideoId = (url) => {
  try {
    // Handle normal URL: https://www.youtube.com/watch?v=VIDEO_ID
    if (url.includes("youtube.com")) {
      const urlObj = new URL(url);
      return urlObj.searchParams.get("v");
    }

    // Handle short URL: https://youtu.be/VIDEO_ID
    if (url.includes("youtu.be")) {
      const parts = url.split('/');
      return parts[parts.length - 1].split('?')[0]; // In case it has ?si=...
    }

    return null;
  } catch (e) {
    return null;
  }
};


  const handleVideoSubmit = () => {
    const videoId = extractVideoId(videoUrl);
    if (videoId) {
      socket.emit("new-video", { roomId, videoId });
    } else {
      alert("Invalid YouTube URL");
    }
  };

  useEffect(() => {
    socket.on("user-count", (count) => {
      setClientCount(count);
    });

    return () => socket.off("user-count");
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      <div style={{ padding: 20 }}>
        <h2>YouTube Sync Player</h2>

        {joined ? (
          <div>
            <h3>Room ID: {roomId}</h3>
            <p>Connected devices: {clientCount}</p>

            {isHost && (
              <div>
                <input
                  type="text"
                  placeholder="Paste YouTube URL"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
                <button onClick={handleVideoSubmit}>Load Video</button>
              </div>
            )}

            <YouTubePlayer roomId={roomId} isHost={isHost} />
          </div>
        ) : (
          <div>
            <button onClick={handleCreateRoom}>Create Room</button>
            <br /><br />
            <input
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
            <button onClick={handleJoinRoom}>Join Room</button>
          </div>
        )}
      </div>
    </SocketContext.Provider>
  );
}

export default App;