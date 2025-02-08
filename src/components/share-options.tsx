export const ShareOptions = ({
    showShareOptions,
    setShowShareOptions,
    downloadImage,
    copyToClipboard
}: {
    showShareOptions: boolean;
    setShowShareOptions: (show: boolean) => void;
    downloadImage: () => void;
    copyToClipboard: () => void;
}) => {
    if (!showShareOptions) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
          <h3 className="text-xl font-bold mb-4">Share Your Card</h3>
          <div className="space-y-3">
            <button
              onClick={() => {
                downloadImage();
                setShowShareOptions(false);
              }}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition flex items-center justify-center space-x-2"
            >
              <span>💾</span>
              <span>Download Image</span>
            </button>
            <button
              onClick={() => {
                copyToClipboard();
                setShowShareOptions(false);
              }}
              className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition flex items-center justify-center space-x-2"
            >
              <span>📋</span>
              <span>Copy to Clipboard</span>
            </button>

            <button
              onClick={() => {
                copyToClipboard();
                setShowShareOptions(false);
              }}
              className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-green-600 transition flex items-center justify-center space-x-2"
            >
              <span></span>
              <span>Send via Futuro</span>
            </button>
          </div>
          <button
            onClick={() => setShowShareOptions(false)}
            className="mt-4 w-full border border-gray-300 py-2 px-4 rounded hover:bg-gray-100 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };