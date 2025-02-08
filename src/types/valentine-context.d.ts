interface ValentineContextProps {
    editingTextColor: string;
    editingTextFontFamily: string;
    editingTextId: string | null;
    editingTextFontWeight: string;
    editingTextValue: string;
    editingTextFontSize: number;
    toggleLayerVisibility: (id: string) => void;
    moveLayer: (index: number, direction: 'up' | 'down') => void;
    backgroundTemplate: BackgroundTemplate;
    setBackgroundColor: React.Dispatch<React.SetStateAction<string>>;
    setCurveColor: React.Dispatch<React.SetStateAction<string>>;
    setEditingTextColor: React.Dispatch<React.SetStateAction<string>>;
    setEditingTextFontFamily: React.Dispatch<React.SetStateAction<string>>;
    setEditingTextFontSize: React.Dispatch<React.SetStateAction<number>>;
    setEditingTextFontWeight: React.Dispatch<React.SetStateAction<string>>;
    setEditingTextId: React.Dispatch<React.SetStateAction<string | null>>;
    setEditingTextValue: React.Dispatch<React.SetStateAction<string>>;
    setLayers: React.Dispatch<React.SetStateAction<LayerItem[]>>;
    layers: LayerItem[];
    backgroundColor: string;
    curveColor: string;
    textProperties: {
        textId: string;
        textColor: string;
        textFontSize: number;
        textFontWeight: string;
        textFontFamily: string;
        textValue: string;
    };
    setTextProperties: React.Dispatch<React.SetStateAction<{
        textId: string;
        textColor: string;
        textFontSize: number;
        textFontWeight: string;
        textFontFamily: string;
        textValue: string;
    }>>;
    setBackgroundTemplate: React.Dispatch<React.SetStateAction<BackgroundTemplate>>;
    editingTextFontSize: number;
}