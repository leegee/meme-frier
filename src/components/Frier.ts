import { PolymerElement, html } from '@polymer/polymer/polymer-element';
import { RangedInput } from './RangedInput';

export class MemeFrier extends PolymerElement {
    static DebounceMs = 250;
    private _lastCallEvent: number | null = null;

    saturation: number | string = 2;
    contrast: number | string = 4;
    brightness: number | string = 2;
    scale: number | string = 1;
    jpegQuality: number | string = 0.9;
    totalJpegs: number | string = 22;
    useOverlay: boolean | string = true;
    noise: number | string = 0.2;

    constructor() {
        super();
        setTimeout(() => {
            this.saturation = 0;
            this.contrast = 0;
        }, 2000);
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
            background: grey;
            padding: 1em;
            text-align: center;
            color: white;
            font-family: sans-serif;
        }
        :host img {
            padding: 0;
            margin: 0;
            text-align: center;
            display: block;
            clear: both;
        }
        </style>
        
        <h1>Meme Frier</h1>

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
            on-change="changeHandler"
            value={{saturation}}
            min=0 max=4 step=0.1 
        ></ranged-input>

        <ranged-input class='vertical'
            label="Contrast" 
            on-change="changeHandler" 
            value={{contrast}}
            min=0 max=10 step=0.5 
        ></ranged-input>

        <ranged-input class='vertical'
            label="Brightness" 
            on-change="changeHandler" 
            value={{brightness}}
            min=0 max=10 step=0.5 
        ></ranged-input>
        `;
    }

    changeHandler(e) {
        // Debounce, delay before action
        if (this._lastCallEvent) {
            clearTimeout(this._lastCallEvent);
        }
        this._lastCallEvent = setTimeout(() => { this._update() }, MemeFrier.DebounceMs);
    }

    private _update() {
        console.log('GUI._update says Update the meme!', this.saturation, this.contrast);
    }
}

