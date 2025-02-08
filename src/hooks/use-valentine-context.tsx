import { useContext } from "react"
import { ValentineContext } from "../context/valentine-context"

export function useValentine() {
    const context = useContext(ValentineContext);

    if (!context) throw new Error(`Context not initialized`);

    return context
}