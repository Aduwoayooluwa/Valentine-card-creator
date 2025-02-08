/* eslint-disable @typescript-eslint/no-explicit-any */
import { useValentine } from "../hooks/use-valentine-context";

 export const LayersPanel= ({ showLayersPanel, setShowLayersPanel}: {
    showLayersPanel: boolean
    setShowLayersPanel :(val: boolean) => void
 }) => { 

    const { toggleLayerVisibility, layers, moveLayer } = useValentine();
    
    if (!showLayersPanel) return null;

    return (
      <div className="absolute right-0 top-0 w-64 bg-white rounded-lg shadow-lg p-4 m-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">Layers</h3>
          <button 
            onClick={() => setShowLayersPanel(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        <div className="space-y-2">
          {layers.map((layer: any, index: number) => (
            <div 
              key={layer.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleLayerVisibility(layer.id)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {layer.visible ? '👁️' : '👁️‍🗨️'}
                </button>
                <span>{layer.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => moveLayer(index, 'up')}
                  disabled={index === 0}
                  className="disabled:opacity-50"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveLayer(index, 'down')}
                  disabled={index === layers.length - 1}
                  className="disabled:opacity-50"
                >
                  ↓
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };