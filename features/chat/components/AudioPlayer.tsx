// features/chat/components/AudioPlayer.tsx
"use client";
import { useRef, useState, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { T } from "../design/tokens";

export function AudioPlayer({ src, mine }: { src: string; mine: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      // Pause all other audio elements on the page
      document.querySelectorAll('audio').forEach((el) => {
        if (el !== audio) {
          el.pause();
        }
      });
    };

    audio.addEventListener('play', handlePlay);
    return () => audio.removeEventListener('play', handlePlay);
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const changePlaybackRate = () => {
    const newRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(newRate);
    if (audioRef.current) audioRef.current.playbackRate = newRate;
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "4px 4px",
        minWidth: 220,
        maxWidth: "100%",
      }}
    >
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        style={{ display: "none" }}
      />
      <button
        onClick={togglePlay}
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: mine ? "rgba(255,255,255,0.2)" : T.accent,
          border: "none",
          color: "#fff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {isPlaying ? (
          <Pause size={18} />
        ) : (
          <Play size={18} style={{ marginLeft: 2 }} />
        )}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            height: 4,
            background: mine ? "rgba(255,255,255,0.3)" : T.border,
            borderRadius: 2,
            overflow: "hidden",
            cursor: "pointer",
          }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            if (audioRef.current && duration) {
              audioRef.current.currentTime = (clickX / rect.width) * duration;
            }
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: mine ? "#fff" : T.accentHover,
              transition: "width 0.1s linear",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 4,
            fontSize: 10,
            color: mine ? "rgba(255,255,255,0.8)" : T.textMuted,
          }}
        >
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <button
        onClick={changePlaybackRate}
        style={{
          background: mine ? "rgba(255,255,255,0.2)" : T.surfaceHover,
          border: "none",
          color: mine ? "#fff" : T.textSecondary,
          borderRadius: 4,
          padding: "2px 6px",
          fontSize: 10,
          fontWeight: 700,
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        {playbackRate}x
      </button>
    </div>
  );
}
