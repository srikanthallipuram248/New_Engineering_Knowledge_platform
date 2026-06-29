import { Mic, MicOff } from "lucide-react";

interface VoiceButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onStart: () => void;
  onStop: () => void;
}

export default function VoiceButton({
  isListening,
  isSupported,
  onStart,
  onStop,
}: VoiceButtonProps) {
  if (!isSupported) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={isListening ? onStop : onStart}
      className={`
        relative
        flex
        h-11
        w-11
        items-center
        justify-center
        rounded-full
        transition-all
        duration-300
        ${
          isListening
            ? "bg-red-500 text-white shadow-lg"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }
      `}
      title={isListening ? "Stop Recording" : "Start Recording"}
    >
      {isListening ? (
        <MicOff size={20} />
      ) : (
        <Mic size={20} />
      )}

      {isListening && (
        <span
          className="
            absolute
            inset-0
            animate-ping
            rounded-full
            bg-red-400
            opacity-40
          "
        />
      )}
    </button>
  );
}



