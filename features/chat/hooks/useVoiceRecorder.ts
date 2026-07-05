// features/chat/hooks/useVoiceRecorder.ts
import { useState, useRef, useEffect, useCallback } from "react";

export function useVoiceRecorder(onSend: (file: File) => void) {
  const [status, setStatus] = useState<
    "idle" | "recording" | "preview" | "uploading"
  >("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (status === "recording") {
      interval = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [status]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Force high-quality audio (128kbps Opus is far better than WhatsApp default)
      const options = {
        mimeType: "audio/webm;codecs=opus",
        audioBitsPerSecond: 128000,
      };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setStatus("preview");

        if (streamRef.current)
          streamRef.current.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setStatus("recording");
    } catch (err) {
      alert("Microphone permission denied or not available.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && status === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, [status]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && status === "recording") {
      mediaRecorderRef.current.onstop = null; // Prevent preview generation
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current)
      streamRef.current.getTracks().forEach((track) => track.stop());
    setPreviewUrl(null);
    setStatus("idle");
  }, [status]);

  const sendRecording = useCallback(() => {
    if (previewUrl) {
      setStatus("uploading");
      fetch(previewUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], `voice-note-${Date.now()}.webm`, {
            type: "audio/webm",
          });
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
          onSend(file);
          setStatus("idle");
        });
    }
  }, [previewUrl, onSend]);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = time % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    status,
    recordingTime,
    previewUrl,
    startRecording,
    stopRecording,
    cancelRecording,
    sendRecording,
    formatTime,
  };
}
