import React, { useContext, useEffect, useRef, useState } from 'react';
import YouTube from 'react-youtube';
import { SocketContext } from './SocketContext';

const YoutubePlayer = ({ roomId, isHost }) => {
  const socket = useContext(SocketContext);
  const playerRef = useRef(null);
  const [videoId, setVideoId] = useState(null);

  const onPlayerReady = (event) => {
    playerRef.current = event.target;
    if (!isHost) {
      event.target.pauseVideo();
    }
  };

  useEffect(() => {
  socket.on("receive-action", (action) => {
    if (!playerRef.current && action.type !== "changeVideo") return;

    if (action.type === "changeVideo") {
      setVideoId(action.videoId);
    } else if (action.type === "play") {
      playerRef.current.seekTo(action.time, true);
      playerRef.current.playVideo();
    } else if (action.type === "pause") {
      playerRef.current.seekTo(action.time, true);
      playerRef.current.pauseVideo();
    }
  });

  return () => socket.off("receive-action");
}, []);


  const handlePlay = () => {
    if (!playerRef.current) return;
    const currentTime = playerRef.current.getCurrentTime();
    socket.emit('sync-action', { roomId, action: { type: 'play', time: currentTime } });
  };

  const handlePause = () => {
    if (!playerRef.current) return;
    const currentTime = playerRef.current.getCurrentTime();
    socket.emit('sync-action', { roomId, action: { type: 'pause', time: currentTime } });
  };


  return (
    <div>
      {videoId && (
        <YouTube
          videoId={videoId}
          opts={{
            height: '350',
            width: '640',
            playerVars: {
              autoplay: 1,
              controls: isHost ? 1 : 1,
              disablekb: 1,
              modestbranding: 1,
              rel: 0
            }
          }}
          onReady={onPlayerReady}
        />
      )}

      {/* Transparent overlay for guests to block interactions */}
      {!isHost && videoId && (
        <div
          style={{
            marginTop: -360,
            width: 640,
            height: 360,
            position: 'relative',
            zIndex: 2
          }}
          onClick={(e) => e.preventDefault()}
        />
      )}

      {isHost && videoId && (
        <div style={{ marginTop: 10 }}>
          <button onClick={handlePlay}>Play</button>
          <button onClick={handlePause}>Pause</button>
        </div>
      )}
    </div>
  );
};

export default YoutubePlayer;