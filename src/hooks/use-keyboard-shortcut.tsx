import { useEffect } from "react";
import { useValentine } from "./use-valentine-context";

export function useShortcut() {
    const { redo, undo, currentHistoryIndex, history } = useValentine();
    
      return useEffect(() => {
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
}