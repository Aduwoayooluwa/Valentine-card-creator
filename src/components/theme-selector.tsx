import { useValentine } from "../hooks/use-valentine-context";
import { colorThemes } from "../lib/color-themes";

export const ThemeSelector = () => {
    const { setBackgroundColor, setCurveColor } = useValentine();

    return (
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
}