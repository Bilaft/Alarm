import React, { useRef } from 'react';
import { Volume2, Play, Upload, X } from 'lucide-react';
import { Sound } from '../types/alarm';

interface SoundSelectorProps {
  sounds: Sound[];
  selectedSound: string;
  onSoundChange: (soundFile: string) => void;
  onAddCustomSound: (sound: Sound) => void;
  onRemoveCustomSound: (soundFile: string) => void;
}

export const SoundSelector: React.FC<SoundSelectorProps> = ({
  sounds,
  selectedSound,
  onSoundChange,
  onAddCustomSound,
  onRemoveCustomSound
}) => {
  const previewAudioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewSound = (soundFile: string) => {
    if (previewAudioRef.current) {
      previewAudioRef.current.src = soundFile;
      previewAudioRef.current.play();
      setTimeout(() => {
        if (previewAudioRef.current) {
          previewAudioRef.current.pause();
          previewAudioRef.current.currentTime = 0;
        }
      }, 2000); // Preview for 2 seconds
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      const url = URL.createObjectURL(file);
      const customSound: Sound = {
        name: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
        file: url,
        isCustom: true
      };
      onAddCustomSound(customSound);
      
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Volume2 className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">Alarm Sound</h3>
      </div>
      
      {/* Upload Button */}
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 hover:border-gray-500/50 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Custom Sound</span>
        </button>
      </div>
      
      <div className="space-y-2">
        {sounds.map((sound, index) => (
          console.log(`Sound ${index}:`, {
            name: sound.name,
            file: sound.file.substring(0, 50) + '...',
            selectedSound: selectedSound.substring(0, 50) + '...',
            isSelected: selectedSound === sound.file
          }),
          <div
            key={index}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
              selectedSound === sound.file
                ? 'bg-purple-500/20 border-purple-500/50'
                : 'bg-gray-700/30 border-gray-600/50 hover:bg-gray-600/30'
            }`}
            onClick={() => onSoundChange(sound.file)}
          >
            <div className="flex items-center space-x-3 flex-1">
              <span className="text-white font-medium">{sound.name}</span>
              {sound.isCustom && (
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                  Custom
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  previewSound(sound.file);
                }}
                className="p-2 rounded-lg bg-gray-600/50 hover:bg-gray-500/50 transition-colors"
              >
                <Play className="w-4 h-4 text-gray-300" />
              </button>
              {sound.isCustom && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveCustomSound(sound.file);
                  }}
                  className="p-2 rounded-lg bg-red-600/50 hover:bg-red-500/50 transition-colors"
                >
                  <X className="w-4 h-4 text-red-300" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <audio ref={previewAudioRef} />
    </div>
  );
};