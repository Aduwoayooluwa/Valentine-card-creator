/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, ChangeEvent, useEffect } from "react";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import "./index.css";
import {  HistoryState, TextElement, AnimationType } from "./types/types";
import { LayersPanel } from "./components/layers-panel";
import { getAnimationStyle, getBackgroundStyle, stickersLibrary } from "./lib";
import { ShareOptions } from "./components/share-options";
import { QuickActionToolbar } from "./components/quick-action-toolbar";
import { ThemeSelector } from "./components/theme-selector";
import { useValentine } from "./hooks/use-valentine-context";


const App: React.FC = () => {


  const {
    editingTextFontFamily,
    editingTextId,
    editingTextFontWeight,
    editingTextValue,
    backgroundTemplate,
    setBackgroundColor,
    setCurveColor,
    setEditingTextColor,
    setEditingTextFontFamily,
    setEditingTextFontSize,
    setEditingTextFontWeight,
    setEditingTextId,
    setEditingTextValue,
    setLayers,
    layers,
    backgroundColor,
    curveColor,
    setBackgroundTemplate,
    editingTextFontSize,
    editingTextColor,
    stickers, redo, setStickers, undo, history, currentHistoryIndex, setHistory, setCurrentHistoryIndex
  } = useValentine();
  

  
  const [draggingStickerId, setDraggingStickerId] = useState<string | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // States for text elements with individual style properties
  const [textElements, setTextElements] = useState<TextElement[]>([]);


  // State for the context menu used for sticker removal
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; stickerId: string | null; }>({ visible: false, x: 0, y: 0, stickerId: null });

  // States for sticker resizing
  const [resizingStickerId, setResizingStickerId] = useState<string | null>(null);
  const [initialResizePos, setInitialResizePos] = useState<{ x: number; y: number } | null>(null);
  const [initialScale, setInitialScale] = useState<number>(1);

  // Ref for the design area to calculate offsets and capture image
  const designAreaRef = useRef<HTMLDivElement>(null);

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);



  const [showLayersPanel, setShowLayersPanel] = useState(false);
  
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

  // function to save state to history
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

  /** Keyboard shortcut manager */
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

  // adding sticker func
  const addSticker = (stickerId: string, src: string) => {
    const newStickerId = stickerId + "-" + Date.now();
    setStickers((prev: any) => [
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
    setLayers((prev: any) => [...prev, {
      id: newStickerId,
      type: 'sticker',
      name: `Sticker ${stickerId}`,
      visible: true,
      zIndex: prev.length // New items go on top
    }]);
    
    saveToHistory();
  };

  const removeSticker = (id: string) => {
    setStickers((prev: any) => prev.filter((sticker: any) => sticker.id !== id));
    // removing from the layers too 
    setLayers((prev: any) => prev.filter((layer: any) => layer.id !== id));
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

  // func to resize stickers. 
  const onResizeMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setResizingStickerId(id);
    setInitialResizePos({ x: e.clientX, y: e.clientY });
    const sticker = stickers.find((st: any) => st.id === id);
    setInitialScale(sticker ? sticker.scale : 1);
  };

  // adding text elements
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
    
    // Addds new layer for the text element
    setLayers((prev: any) => [...prev, {
      id: newId,
      type: 'text',
      name: `Text: "${newTextElement.text}"`,
      visible: true,
      zIndex: prev.length 
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
    setLayers((prev: any) => [...prev, {
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
    setLayers((prev: any) => prev.map((layer: any) => 
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
      setStickers((prev: any) =>
        prev.map((sticker: any) =>
          sticker.id === resizingStickerId ? { ...sticker, scale: newScale } : sticker
        )
      );
    }
    // Otherwise, if dragging is in progress, update sticker/text position
    else if (draggingStickerId && designAreaRef.current) {
      const designRect = designAreaRef.current.getBoundingClientRect();
      setStickers((prev: any) =>
        prev.map((sticker: any) =>
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

  //  download imahe functionality
  const downloadImage = async () => {
    if (designAreaRef.current) {
      try {
        const canvas = await html2canvas(designAreaRef.current, {
          backgroundColor: null,
          scale: 2,
          useCORS: true,
        });
        
       
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
      
        }
      }

      //  the sharing options will display if the share web API is not avalable. 
      setShowShareOptions(true);
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Sorry, there was an error creating your card. Please try again.');
    }
  };


  // Add click handlers for deselection
  const onDesignAreaClick = (e: React.MouseEvent) => {
    // deselects if clicking directly on the design area  and not on elements
    if (e.target === e.currentTarget) {
      setSelectedElementId(null);
    }
  };

  // touch event handlers
  const onTouchStart = (e: React.TouchEvent, id: string) => {
    e.preventDefault(); // Prevent scrolling while dragging
    setDraggingStickerId(id);
    setSelectedElementId(id);
    
    const touch = e.touches[0];
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    setOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!draggingStickerId || !designAreaRef.current) return;
    
    const touch = e.touches[0];
    const designRect = designAreaRef.current.getBoundingClientRect();
    
    // Update position for both stickers and text elements
    setStickers((prev: any) =>
      prev.map((sticker: any) =>
        sticker.id === draggingStickerId
          ? {
              ...sticker,
              x: touch.clientX - designRect.left - offset.x,
              y: touch.clientY - designRect.top - offset.y,
            }
          : sticker
      )
    );
    
    setTextElements(prev =>
      prev.map(txt =>
        txt.id === draggingStickerId
          ? {
              ...txt,
              x: touch.clientX - designRect.left - offset.x,
              y: touch.clientY - designRect.top - offset.y,
            }
          : txt
      )
    );
  };

  const onTouchEnd = () => {
    setDraggingStickerId(null);
    saveToHistory();
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
          style={getBackgroundStyle(backgroundColor, backgroundTemplate, curveColor)}
          onMouseMove={onMouseMove}
          onTouchMove={onTouchMove}
          onMouseUp={onMouseUp}
          onTouchEnd={onTouchEnd}
          onMouseLeave={onMouseUp}
          onClick={onDesignAreaClick}
        >
          {/* Render stickers */}
          {stickers.map((sticker: any) => {
            const layer = layers.find((lay: any) => (lay).id === sticker.id);
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
                  ...getAnimationStyle(sticker.animation),
                  touchAction: "none" // Prevent browser touch actions
                }}
              >
                <img
                  src={sticker.src}
                  alt="sticker"
                  className="w-20 h-20 cursor-move select-none"
                  onMouseDown={(e) => onStickerMouseDown(e, sticker.id)}
                  onTouchStart={(e) => onTouchStart(e, sticker.id)}
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
                touchAction: "none",
                ...getAnimationStyle(txt.animation)
              }}
              onMouseDown={(e) => onTextMouseDown(e, txt.id)}
              onTouchStart={(e) => onTouchStart(e, txt.id)}
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

       <div className="flex items-center space-x-3">
     

        <button
        onClick={() => setShowLayersPanel(!showLayersPanel)}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600 transition"
      >
        Layers
      </button>

      <button
          className="bg-red-500 text-white px-6 py-2 text-nowrap rounded-lg shadow hover:bg-red-600 transition"
          onClick={handleShare}
        >
          Share Card
        </button>
       </div>
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
              setStickers((prev: any) =>
                prev.map((sticker: any) =>
                  sticker.id === selectedElementId ? { ...sticker, animation } : sticker
                )
              );
            }
          }
        }}
      />

      <LayersPanel showLayersPanel={showLayersPanel} setShowLayersPanel={setShowLayersPanel} />

      <ShareOptions showShareOptions={showShareOptions} setShowShareOptions={setShowShareOptions} copyToClipboard={copyToClipboard} downloadImage={downloadImage} />
    </div>
  );
};

export default App;
