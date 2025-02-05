/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, ChangeEvent, useEffect } from "react";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import "./index.css";
import { HistoryState, LayerItem, Sticker, TextElement, AnimationType } from "./types/types";
import { stickersLibrary } from "./lib";
import { colorThemes } from "./lib/color-themes";

const App: React.FC = () => {
  
  // States for background and stickers
  const [backgroundColor, setBackgroundColor] = useState<string>("#FFC0CB");

  // New state for curves color (default set to light gray)
  const [curveColor, setCurveColor] = useState<string>("#ddd");

  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [draggingStickerId, setDraggingStickerId] = useState<string | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // States for text elements with individual style properties
  const [textElements, setTextElements] = useState<TextElement[]>([]);


  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState<string>("");
  const [editingTextColor, setEditingTextColor] = useState<string>("");
  const [editingTextFontSize, setEditingTextFontSize] = useState<number>(0);
  const [editingTextFontWeight, setEditingTextFontWeight] = useState<string>("");
  const [editingTextFontFamily, setEditingTextFontFamily] = useState<string>("");

  // State for background template selection
  type BackgroundTemplate = "plain" | "lines" | "grid" | "curves";
  const [backgroundTemplate, setBackgroundTemplate] = useState<BackgroundTemplate>("plain");

  // State for the context menu used for sticker removal
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; stickerId: string | null; }>({ visible: false, x: 0, y: 0, stickerId: null });

  // States for sticker resizing
  const [resizingStickerId, setResizingStickerId] = useState<string | null>(null);
  const [initialResizePos, setInitialResizePos] = useState<{ x: number; y: number } | null>(null);
  const [initialScale, setInitialScale] = useState<number>(1);

  // Ref for the design area to calculate offsets and capture image
  const designAreaRef = useRef<HTMLDivElement>(null);

  // Add this new state near the other state declarations
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Add these states near other state declarations
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);

  // Add these states
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [showLayersPanel, setShowLayersPanel] = useState(false);

  // Add this state near other state declarations
  const [showShareOptions, setShowShareOptions] = useState(false);

  // Hide context menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false, x: 0, y: 0, stickerId: null });
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [contextMenu.visible]);

  // Add this function to save state to history
  const saveToHistory = () => {
    const newState: HistoryState = {
      stickers: [...stickers],
      textElements: [...textElements],
    };

    // Remove any future states if we're not at the end of history
    const newHistory = history.slice(0, currentHistoryIndex + 1);
    
    setHistory([...newHistory, newState]);
    setCurrentHistoryIndex(newHistory.length);
  };

  // Add undo/redo functions
  const undo = () => {
    if (currentHistoryIndex > 0) {
      const newIndex = currentHistoryIndex - 1;
      const previousState = history[newIndex];
      setStickers(previousState.stickers);
      setTextElements(previousState.textElements);
      setCurrentHistoryIndex(newIndex);
    }
  };

  const redo = () => {
    if (currentHistoryIndex < history.length - 1) {
      const newIndex = currentHistoryIndex + 1;
      const nextState = history[newIndex];
      setStickers(nextState.stickers);
      setTextElements(nextState.textElements);
      setCurrentHistoryIndex(newIndex);
    }
  };

  // Add keyboard shortcut handler
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [currentHistoryIndex, history]);

  // --- Sticker Functions ---
  const addSticker = (stickerId: string, src: string) => {
    const newStickerId = stickerId + "-" + Date.now();
    setStickers((prev) => [
      ...prev,
      {
        id: newStickerId,
        src,
        x: 50,
        y: 50,
        scale: 1,
        animation: 'none' as AnimationType,
      },
    ]);
    
    // Add new layer for the sticker
    setLayers(prev => [...prev, {
      id: newStickerId,
      type: 'sticker',
      name: `Sticker ${stickerId}`,
      visible: true,
      zIndex: prev.length // New items go on top
    }]);
    
    saveToHistory();
  };

  const removeSticker = (id: string) => {
    setStickers((prev) => prev.filter((sticker) => sticker.id !== id));
    // Also remove from layers
    setLayers(prev => prev.filter(layer => layer.id !== id));
    setContextMenu({ visible: false, x: 0, y: 0, stickerId: null });
    saveToHistory();
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          addSticker("user", event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const onStickerMouseDown = (e: React.MouseEvent, id: string) => {
    if (e.button !== 0) return;
    if (resizingStickerId) return;
    setDraggingStickerId(id);
    setSelectedElementId(id);
    const stickerDiv = e.currentTarget as HTMLDivElement;
    const rect = stickerDiv.getBoundingClientRect();
    setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const onStickerContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      stickerId: id,
    });
  };

  // Sticker Resizing Handlers
  const onResizeMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setResizingStickerId(id);
    setInitialResizePos({ x: e.clientX, y: e.clientY });
    const sticker = stickers.find((st) => st.id === id);
    setInitialScale(sticker ? sticker.scale : 1);
  };

  // --- Text Element Functions ---
  const addTextElement = () => {
    const newId = "text-" + Date.now();
    const newTextElement: TextElement = {
      id: newId,
      text: "Edit me",
      x: 100,
      y: 100,
      color: "#000000",
      fontSize: 20,
      fontWeight: "bold",
      animation: 'none' as AnimationType,
    };
    
    setTextElements((prev) => [...prev, newTextElement]);
    
    // Add new layer for the text element
    setLayers(prev => [...prev, {
      id: newId,
      type: 'text',
      name: `Text: "${newTextElement.text}"`,
      visible: true,
      zIndex: prev.length // New items go on top
    }]);
    
    setEditingTextId(newId);
    setEditingTextValue(newTextElement.text);
    setEditingTextColor(newTextElement.color);
    setEditingTextFontSize(newTextElement.fontSize);
    setEditingTextFontWeight(newTextElement.fontWeight);
    setEditingTextFontFamily(newTextElement.fontFamily || "");
    saveToHistory();
  };

  const addDefaultMessage = () => {
    const newId = "text-" + Date.now();
    const defaultMessage: TextElement = {
      id: newId,
      text: "Happy Valentine's Day!",
      x: 150,
      y: 150,
      color: "#ff3366",
      fontSize: 36,
      fontWeight: "bold",
      fontFamily: "'Lobster', cursive",
      animation: 'none' as AnimationType,
    };
    
    setTextElements((prev) => [...prev, defaultMessage]);
    
    // Add new layer for the default message
    setLayers(prev => [...prev, {
      id: newId,
      type: 'text',
      name: `Text: "Happy Valentine's Day!"`,
      visible: true,
      zIndex: prev.length
    }]);
    
    saveToHistory();
  };

  const onTextMouseDown = (e: React.MouseEvent, id: string) => {
    if (e.button !== 0) return;
    setDraggingStickerId(id);
    setSelectedElementId(id);
    const target = e.currentTarget as HTMLDivElement;
    const rect = target.getBoundingClientRect();
    setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const onTextDoubleClick = (
    id: string,
    currentText: string,
    currentColor: string,
    currentFontSize: number,
    currentFontWeight: string,
    currentFontFamily?: string
  ) => {
    setEditingTextId(id);
    setEditingTextValue(currentText);
    setEditingTextColor(currentColor);
    setEditingTextFontSize(currentFontSize);
    setEditingTextFontWeight(currentFontWeight);
    setEditingTextFontFamily(currentFontFamily || "");
  };

  const finishEditing = (id: string) => {
    setTextElements((prev) =>
      prev.map((txt) =>
        txt.id === id
          ? {
              ...txt,
              text: editingTextValue,
              color: editingTextColor,
              fontSize: editingTextFontSize,
              fontWeight: editingTextFontWeight,
              fontFamily: editingTextFontFamily,
            }
          : txt
      )
    );
    
    // Update layer name with new text
    setLayers(prev => prev.map(layer => 
      layer.id === id
        ? { ...layer, name: `Text: "${editingTextValue}"` }
        : layer
    ));
    
    setEditingTextId(null);
    setEditingTextValue("");
    saveToHistory();
  };

  // --- Global Mouse Handlers in Design Area ---
  const onMouseMove = (e: React.MouseEvent) => {
    // If a sticker is being resized, update its scale
    if (resizingStickerId && initialResizePos) {
      const dx = e.clientX - initialResizePos.x;
      const dy = e.clientY - initialResizePos.y;
      const delta = (dx + dy) / 200;
      const newScale = Math.max(0.2, initialScale + delta);
      setStickers((prev) =>
        prev.map((sticker) =>
          sticker.id === resizingStickerId ? { ...sticker, scale: newScale } : sticker
        )
      );
    }
    // Otherwise, if dragging is in progress, update sticker/text position
    else if (draggingStickerId && designAreaRef.current) {
      const designRect = designAreaRef.current.getBoundingClientRect();
      setStickers((prev) =>
        prev.map((sticker) =>
          sticker.id === draggingStickerId
            ? {
                ...sticker,
                x: e.clientX - designRect.left - offset.x,
                y: e.clientY - designRect.top - offset.y,
              }
            : sticker
        )
      );
      setTextElements((prev) =>
        prev.map((txt) =>
          txt.id === draggingStickerId
            ? {
                ...txt,
                x: e.clientX - designRect.left - offset.x,
                y: e.clientY - designRect.top - offset.y,
              }
            : txt
        )
      );
    }
  };

  const onMouseUp = () => {
    setDraggingStickerId(null);
    setResizingStickerId(null);
  };

  // --- Handle Share ---
  const downloadImage = async () => {
    if (designAreaRef.current) {
      try {
        const canvas = await html2canvas(designAreaRef.current, {
          backgroundColor: null,
          scale: 2, // Higher quality
          useCORS: true, // Enable cross-origin image loading
        });
        
        // Create download link
        const link = document.createElement('a');
        link.download = 'valentine-card.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (error) {
        console.error('Error generating image:', error);
        alert('Sorry, there was an error creating your card. Please try again.');
      }
    }
  };

  const copyToClipboard = async () => {
    if (designAreaRef.current) {
      try {
        const canvas = await html2canvas(designAreaRef.current, {
          backgroundColor: null,
          scale: 2,
          useCORS: true,
        });
        
        canvas.toBlob(async (blob) => {
          if (blob) {
            try {
              await navigator.clipboard.write([
                new ClipboardItem({
                  'image/png': blob
                })
              ]);
              alert('Card copied to clipboard!');
            } catch (error) {
              console.error('Error copying to clipboard:', error);
              alert('Unable to copy to clipboard. Try downloading instead.');
            }
          }
        }, 'image/png');
      } catch (error) {
        console.error('Error generating image:', error);
        alert('Sorry, there was an error creating your card. Please try again.');
      }
    }
  };

  const handleShare = async () => {
    if (!designAreaRef.current) return;

    try {
      const canvas = await html2canvas(designAreaRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png');
      });

      // Check if Web Share API is available
      if (navigator.share) {
        const file = new File([blob], 'valentine-card.png', { type: 'image/png' });
        try {
          await navigator.share({
            title: 'My Valentine Card',
            text: 'Check out my Valentine card!',
            files: [file],
          });
          return;
        } catch (error) {
          console.error('Error sharing:', error);
          // Fall back to other methods if sharing fails
        }
      }

      // If Web Share API is not available or fails, show sharing options
      setShowShareOptions(true);
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Sorry, there was an error creating your card. Please try again.');
    }
  };

  // --- Background Template Styles ---
  const getBackgroundStyle = () => {
    // Always include the chosen backgroundColor in the style.
    const baseStyle = { backgroundColor };

    switch (backgroundTemplate) {
      case "plain":
        return baseStyle;
      case "lines":
        return {
          ...baseStyle,
          backgroundImage: `repeating-linear-gradient(45deg, ${backgroundColor}, ${backgroundColor} 10px, #ddd 10px, #ddd 20px)`,
        };
      case "grid":
        return {
          ...baseStyle,
          backgroundImage:
            "linear-gradient(0deg, transparent 24%, #ddd 25%, #ddd 26%, transparent 27%, transparent 74%, #ddd 75%, transparent 76%), " +
            "linear-gradient(90deg, transparent 24%, #ddd 25%, #ddd 26%, transparent 27%, transparent 74%, #ddd 75%, transparent 76%)",
          backgroundSize: "50px 50px",
        };
      case "curves":
        {
          // Encode the curves color so it is URL-safe
          const encodedCurveColor = encodeURIComponent(curveColor);
          return {
            ...baseStyle,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 200'%3E%3Cpath fill='${encodedCurveColor}' d='M0 100 Q 300 0 600 100 T 600 200 L 0 200 Z'/%3E%3C/svg%3E")`,
            backgroundSize: "cover",
          };
        }
      default:
        return baseStyle;
    }
  };

  // Add this function after the existing functions
  const getAnimationStyle = (animation: AnimationType) => {
    switch (animation) {
      case 'bounce':
        return {
          animation: 'bounce 2s infinite'
        };
      case 'pulse':
        return {
          animation: 'pulse 1.5s infinite'
        };
      case 'shake':
        return {
          animation: 'shake 0.5s infinite'
        };
      case 'float':
        return {
          animation: 'float 3s infinite'
        };
      default:
        return {};
    }
  };

  // Add this component near the Additional Options section
  const ThemeSelector = () => (
    <div className="flex items-center space-x-2">
      <label className="block text-white font-medium">Theme:</label>
      <select
        onChange={(e) => {
          const theme = colorThemes[parseInt(e.target.value)];
          setBackgroundColor(theme.background);
          setCurveColor(theme.curves);
        }}
        className="border-0 rounded p-1"
      >
        <option value="">Custom</option>
        {colorThemes.map((theme, index) => (
          <option key={theme.name} value={index}>
            {theme.name}
          </option>
        ))}
      </select>
    </div>
  );

  // Add this component
  const QuickActionToolbar: React.FC<{
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

  // Add click handlers for deselection
  const onDesignAreaClick = (e: React.MouseEvent) => {
    // Only deselect if clicking directly on the design area (not on elements)
    if (e.target === e.currentTarget) {
      setSelectedElementId(null);
    }
  };

  // Add this component for the layers panel
  const LayersPanel: React.FC = () => {
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
          {layers.map((layer, index) => (
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

  // Add layer management functions
  const toggleLayerVisibility = (id: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === id ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  const moveLayer = (index: number, direction: 'up' | 'down') => {
    const newLayers = [...layers];
    if (direction === 'up' && index > 0) {
      [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
    } else if (direction === 'down' && index < newLayers.length - 1) {
      [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
    }
    
    // Update z-indexes
    newLayers.forEach((layer, idx) => {
      layer.zIndex = idx;
    });
    
    setLayers(newLayers);
  };

  // Add this component for share options
  const ShareOptions: React.FC = () => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br w-full from-pink-300 to-red-300 flex flex-col items-center p-4">
      <h1 className="text-4xl font-bold text-white mb-4 text-center">
        Virtual Valentine's Card Creator
      </h1>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 w-full max-w-5xl">
        {/* Sidebar for stickers, uploading, and adding text */}
        <div className="w-full md:w-1/4 bg-white rounded-lg p-4 shadow-lg">
          <h2 className="text-xl font-semibold mb-2 text-red-500">Stickers</h2>
          <div className="flex flex-wrap gap-2 justify-center">
            {stickersLibrary.map((sticker) => (
              <motion.img
                key={sticker.id}
                src={sticker.src}
                alt={sticker.id}
                className="w-16 h-16 cursor-pointer hover:scale-110 transition-transform"
                whileHover={{ scale: 1.2 }}
                onClick={() => addSticker(sticker.id, sticker.src)}
              />
            ))}
          </div>
          <div className="mt-4">
            <label className="block text-red-500 font-medium mb-1">
              Upload Your Own:
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="w-full"
            />
          </div>
          <div className="mt-4 space-y-2">
            <button
              onClick={addTextElement}
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
            >
              Add Text
            </button>
            <button
              onClick={addDefaultMessage}
              className="w-full bg-purple-500 text-white py-2 rounded hover:bg-purple-600 transition"
            >
              Add Default Message
            </button>
          </div>
        </div>

        {/* Design Area */}
        <div
          ref={designAreaRef}
          className="relative w-full md:w-3/4 h-[500px] rounded-lg shadow-lg overflow-hidden p-2"
          style={getBackgroundStyle()}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onClick={onDesignAreaClick}
        >
          {/* Render stickers */}
          {stickers.map((sticker) => {
            const layer = layers.find(l => l.id === sticker.id);
            if (layer && !layer.visible) return null;
            
            return (
              <motion.div
                key={sticker.id}
                className={`absolute ${selectedElementId === sticker.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                style={{
                  left: sticker.x,
                  top: sticker.y,
                  transform: `scale(${sticker.scale})`,
                  transformOrigin: "top left",
                  zIndex: layer?.zIndex || 0,
                  ...getAnimationStyle(sticker.animation)
                }}
              >
                <img
                  src={sticker.src}
                  alt="sticker"
                  className="w-20 h-20 cursor-move select-none"
                  onMouseDown={(e) => onStickerMouseDown(e, sticker.id)}
                  onContextMenu={(e) => onStickerContextMenu(e, sticker.id)}
                />
                {/* Resize handle */}
                <div
                  className="absolute bottom-0 right-0 w-4 h-4 bg-gray-500 cursor-se-resize"
                  onMouseDown={(e) => onResizeMouseDown(e, sticker.id)}
                />
              </motion.div>
            );
          })}

          {/* Render text elements */}
          {textElements.map((txt) => (
            <motion.div
              key={txt.id}
              className={`absolute select-none cursor-move ${selectedElementId === txt.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
              style={{ 
                left: txt.x, 
                top: txt.y,
                ...getAnimationStyle(txt.animation)
              }}
              onMouseDown={(e) => onTextMouseDown(e, txt.id)}
              onDoubleClick={() =>
                onTextDoubleClick(
                  txt.id,
                  txt.text,
                  txt.color,
                  txt.fontSize,
                  txt.fontWeight,
                  txt.fontFamily
                )
              }
              drag
              dragConstraints={designAreaRef}
              dragElastic={0.2}
              dragMomentum={false}
            >
              {editingTextId === txt.id ? (
                <div className="flex flex-col space-y-1">
                  <input
                    type="text"
                    className="bg-transparent border border-dashed p-1"
                    value={editingTextValue}
                    onChange={(e) => setEditingTextValue(e.target.value)}
                    autoFocus
                  />
                  <div className="flex items-center space-x-2">
                    <label className="text-sm">Color:</label>
                    <input
                      type="color"
                      value={editingTextColor}
                      onChange={(e) => setEditingTextColor(e.target.value)}
                    />
                    <label className="text-sm">Size:</label>
                    <input
                      type="number"
                      value={editingTextFontSize}
                      onChange={(e) =>
                        setEditingTextFontSize(Number(e.target.value))
                      }
                      className="w-16"
                      min={10}
                      max={72}
                    />
                    <label className="text-sm">Weight:</label>
                    <select
                      value={editingTextFontWeight}
                      onChange={(e) => setEditingTextFontWeight(e.target.value)}
                      className="border rounded text-sm"
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                      <option value="bolder">Bolder</option>
                    </select>
                    <label className="text-sm">Font:</label>
                    <input
                      type="text"
                      value={editingTextFontFamily}
                      onChange={(e) => setEditingTextFontFamily(e.target.value)}
                      placeholder="e.g., 'Lobster', cursive"
                      className="border rounded text-sm p-1"
                    />
                    <button
                      onClick={() => finishEditing(txt.id)}
                      className="bg-green-500 text-white px-2 py-1 rounded text-sm"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <span
                  style={{
                    color: txt.color,
                    fontSize: txt.fontSize,
                    fontWeight: txt.fontWeight,
                    fontFamily: txt.fontFamily,
                  }}
                >
                  {txt.text}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Additional Options */}
      <div className="mt-4 w-full max-w-5xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <label className="block text-white font-medium">
              Background Color:
            </label>
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="w-16 h-10 border-0 rounded"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="block text-white font-medium">Template:</label>
            <select
              value={backgroundTemplate}
              onChange={(e) => setBackgroundTemplate(e.target.value as any)}
              className="border-0 rounded p-1"
            >
              <option value="plain">Plain</option>
              <option value="lines">Lines</option>
              <option value="grid">Grid</option>
              <option value="curves">Curves</option>
            </select>
          </div>
          {/* Only show the curves color picker when the curves template is selected */}
          {backgroundTemplate === "curves" && (
            <div className="flex items-center space-x-2">
              <label className="block text-white font-medium">
                Curves Color:
              </label>
              <input
                type="color"
                value={curveColor}
                onChange={(e) => setCurveColor(e.target.value)}
                className="w-16 h-10 border-0 rounded"
              />
            </div>
          )}
          <ThemeSelector />
        </div>

        <button
          className="bg-red-500 text-white px-6 py-2 rounded-lg shadow hover:bg-red-600 transition"
          onClick={handleShare}
        >
          Share Card
        </button>
      </div>

      {/* Custom Context Menu for Sticker Removal */}
      {contextMenu.visible && (
        <div
          className="fixed z-50 bg-white border rounded shadow-md"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="px-4 py-2 text-red-600 hover:bg-red-100"
            onClick={() => {
              if (contextMenu.stickerId) {
                removeSticker(contextMenu.stickerId);
              }
            }}
          >
            Delete
          </button>
        </div>
      )}

      {/* Quick Action Toolbar */}
      <QuickActionToolbar
        selectedId={selectedElementId}
        onDelete={() => {
          if (selectedElementId) {
            if (selectedElementId.startsWith('text-')) {
              setTextElements(prev => prev.filter(txt => txt.id !== selectedElementId));
            } else {
              removeSticker(selectedElementId);
            }
            setSelectedElementId(null);
          }
        }}
        onAnimate={(animation) => {
          if (selectedElementId) {
            if (selectedElementId.startsWith('text-')) {
              setTextElements(prev =>
                prev.map(txt =>
                  txt.id === selectedElementId ? { ...txt, animation } : txt
                )
              );
            } else {
              setStickers(prev =>
                prev.map(sticker =>
                  sticker.id === selectedElementId ? { ...sticker, animation } : sticker
                )
              );
            }
          }
        }}
      />

      {/* Add this button to the toolbar area */}
      <button
        onClick={() => setShowLayersPanel(!showLayersPanel)}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600 transition"
      >
        Layers
      </button>

      <LayersPanel />

      <ShareOptions />
    </div>
  );
};

export default App;
