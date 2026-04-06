"use client";

import { useState } from "react";

const VideoPlayer = ({ url, className = "w-full" }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const playPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="w-full relative">
      <video
        src={url}
        onClick={playPause}
        controls={true}
        className={className}
      />
    </div>
  );
};

export default VideoPlayer;
