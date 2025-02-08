import { AnimationType } from "../types/types";

export const stickersLibrary = [
    { id: "heart", src: "/heart.png" },
    { id: "cupid", src: "/cupid.png" },
    { id: "rose", src: "/rose.png" },
  ];


  export  const getAnimationStyle = (animation: AnimationType) => {
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

  export const getBackgroundStyle = (backgroundColor: string, backgroundTemplate: string, curveColor: string) => {
   
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
          // Encoded curves color to ensure safety. 
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
