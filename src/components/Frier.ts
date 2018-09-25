import { PolymerElement, html } from '@polymer/polymer/polymer-element';
import { RangedInput } from './RangedInput';

export class MemeFrier extends PolymerElement {
    static DebounceMs = 250;
    private _lastCallEvent: number | null = null;

    saturation: number = 2;
    contrast: number = 4;
    brightness: number = 2;
    scale: number = 1;
    jpegQuality: number = 0.9;
    totalJpegs: number = 22;
    useOverlay: boolean = true;
    noise: number = 0.2;

    constructor() {
        super();
    }

    static get properties() {
        return {
            saturation: { type: Number, reflectToAttribute: true, notify: true },
            contrast: { type: Number, reflectToAttribute: true, notify: true },
            brightness: { type: Number, reflectToAttribute: true, notify: true },
            scale: { type: Number, reflectToAttribute: true, notify: true },
            jpegQuality: { type: Number, reflectToAttribute: true, notify: true },
            totalJpegs: { type: Number, reflectToAttribute: true, notify: true },
            useOverlay: { type: Number, reflectToAttribute: true, notify: true },
            noise: { type: Number, reflectToAttribute: true, notify: true }
        }
    }

    static get template() {
        return html`
        <style>
        :host { 
            display: block;
        }
        </style>
        
        <fried-meme
            saturate={{saturation}}
            contrast={{contrast}}
            brightness={{brightness}}
            scale={{scale}}
            jpeg-quality={{jpegQuality}}
            total-jpegs={{totalJpegs}}
            use-overlay={{useOverlay}}
            noise={{noise}}
        ></fried-meme>

        <ranged-input class='vertical'
            label="Saturation" 
            value={{saturation}}
            min=0 max=4 step=0.1 
        ></ranged-input>

        <ranged-input class='vertical'
            label="Contrast" 
            value={{contrast}}
            min=0 max=10 step=0.5 
        ></ranged-input>

        <ranged-input class='vertical'
            label="Brightness" 
            value={{brightness}}
            min=0 max=10 step=0.5 
        ></ranged-input>

        <ranged-input class='vertical'
            label="Quality" 
            value={{jpegQuality}}
            min=0 max=1 step=0.05 
        ></ranged-input>

        <ranged-input class='vertical'
            label="Noise" 
            value={{noise}}
            min=0 max=1 step=0.01
        ></ranged-input>

        <ranged-input class='vertical'
            label="Iterations" 
            value={{totalJpegs}}
            min=1 max=50 step=1
        ></ranged-input>
        `;
    }
}

