// the type for each of the sticker properties. 
export type Sticker = {
  id: string;
  src: string;
  x: number;
  y: number;
  scale: number;
  animation: AnimationType;
};

// type for each of the text element properties. 
export type TextElement = {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  fontWeight: string;
  fontFamily?: string;
  animation: AnimationType;
};

// type for the animation type for each of the elements. 
export type AnimationType = 'bounce' | 'pulse' | 'shake' | 'float' | 'none';

// Add these types near the other type definitions
export type HistoryState = {
  stickers: Sticker[];
  textElements: TextElement[];
};



// Add this type for layer items
export type LayerItem = {
  id: string;
  type: 'sticker' | 'text';
  name: string;
  visible: boolean;
  zIndex: number;
};