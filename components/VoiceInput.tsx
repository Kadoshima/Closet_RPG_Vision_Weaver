import React, { useState, useRef } from 'react';

interface VoiceInputProps {
  onAudioRecorded: (base64Audio: string) => void;
  isProcessing: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onAudioRecorded, isProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' }); // simplified type
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          onAudioRecorded(base64String);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access is needed for Vibe Search.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 my-4">
       <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`
          relative w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all
          ${isRecording ? 'border-red-500 bg-red-900/50 animate-pulse' : 'border-rpg-magic bg-slate-800 hover:bg-slate-700'}
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {isProcessing ? (
           <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
           </svg>
        ) : (
          <span className="material-icons text-2xl text-white">
            {isRecording ? 'stop' : 'mic'}
          </span>
        )}
      </button>
      <p className="text-xs font-mono text-slate-400">
        {isRecording ? "Listening for Vibes..." : "Hold to Speak (e.g. 'Kuta-tto')"}
      </p>
    </div>
  );
};
