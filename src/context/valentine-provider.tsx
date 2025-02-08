import React, { useState } from "react";
import { ValentineContext } from "./valentine-context";
import { BackgroundTemplate, HistoryState, LayerItem, Sticker, TextElement } from "../types/types";

const ValentineProvider = ({ children}: {
    children: React.ReactNode
}) => {

    // states to manage the color of the curves
      const [curveColor, setCurveColor] = useState<string>("#ddd");

      // background and sticker states. 
      const [backgroundColor, setBackgroundColor] = useState<string>("#FFC0CB");

    const [textProperties, setTextProperties] = useState({
        textId: "",
        textColor: "",
        textFontSize: 0,
        textFontWeight: "",
        textFontFamily: "",
        textValue: ""
      })

     const [editingTextId, setEditingTextId] = useState<string | null>(null);
    const [editingTextValue, setEditingTextValue] = useState<string>("");
      const [editingTextColor, setEditingTextColor] = useState<string>("");
      const [editingTextFontSize, setEditingTextFontSize] = useState<number>(0);
      const [editingTextFontWeight, setEditingTextFontWeight] = useState<string>("");
      const [editingTextFontFamily, setEditingTextFontFamily] = useState<string>("");
    //   states to manage the history
        const [history, setHistory] = useState<HistoryState[]>([]);
        const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);

        const [stickers, setStickers] = useState<Sticker[]>([]);

      const [backgroundTemplate, setBackgroundTemplate] = useState<BackgroundTemplate>("plain");

      const [layers, setLayers] = useState<LayerItem[]>([]);

        const [textElements, setTextElements] = useState<TextElement[]>([]);

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
    
      
    return (
        <ValentineContext.Provider value={{
            editingTextColor,
            editingTextFontFamily,
            editingTextId,
            editingTextFontWeight,
            editingTextValue,
            toggleLayerVisibility,
            moveLayer,
            backgroundTemplate,
            textElements, 
            setTextElements,
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
            history, 
            currentHistoryIndex,
            setHistory,
            setCurrentHistoryIndex,
            backgroundColor,
            curveColor,
            textProperties,
            setTextProperties,
            setBackgroundTemplate,
            editingTextFontSize,
            undo, redo,
            stickers, setStickers


        }}>
            { children }
        </ValentineContext.Provider>
    )
}

export default ValentineProvider;