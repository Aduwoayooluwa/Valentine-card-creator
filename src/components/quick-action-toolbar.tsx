import { AnimationType } from "../types/types";

export const QuickActionToolbar: React.FC<{
    selectedId: string | null;
    onDelete: () => void;
    onAnimate: (animation: AnimationType) => void;
  }> = ({ selectedId, onDelete, onAnimate }) => {
    if (!selectedId) return null;

    return (
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-2 flex space-x-2">
        <button
          onClick={() => onAnimate('bounce')}
          className="p-2 hover:bg-gray-100 rounded"
        >
          🔄 Bounce
        </button>
        <button
          onClick={() => onAnimate('pulse')}
          className="p-2 hover:bg-gray-100 rounded"
        >
          💓 Pulse
        </button>
        <button
          onClick={() => onAnimate('shake')}
          className="p-2 hover:bg-gray-100 rounded"
        >
          📳 Shake
        </button>
        <button
          onClick={() => onAnimate('float')}
          className="p-2 hover:bg-gray-100 rounded"
        >
          🎈 Float
        </button>
        <button
          onClick={() => onAnimate('none')}
          className="p-2 hover:bg-gray-100 rounded"
        >
          ⏹️ Stop
        </button>
        <button
          onClick={onDelete}
          className="p-2 hover:bg-red-100 text-red-600 rounded"
        >
          🗑️ Delete
        </button>
      </div>
    );
  };