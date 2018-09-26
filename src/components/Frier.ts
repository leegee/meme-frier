import { PolymerElement, html } from '@polymer/polymer/polymer-element';

export class MemeFrier extends PolymerElement {
    src!: string;
    saturation: number = 2;
    contrast: number = 4;
    brightness: number = 2;
    scale: number = 1;
    jpegQuality: number = 0.9;
    totalJpegs: number = 22;
    useOverlay: boolean = true;
    noise: number = 0.2;
    hueRotate: number = 0;

    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();
        this.$.save.addEventListener("click", (e: Event) => {
            (this.$.meme as HTMLElement).dispatchEvent(new CustomEvent("save-image"));
        });
        this.$.load.addEventListener("click", (e: Event) => {
            (this.$.chooseFile as HTMLElement).click();
        });
        this.$.meme.addEventListener("click", (e: Event) => {
            (this.$.chooseFile as HTMLElement).click();
        });
        this.$.chooseFile.addEventListener("change", (e: Event) => {
            if (e && e.target && (e.target as HTMLInputElement).files && (e.target as HTMLInputElement).files!.length) {
                const file = (e.target as HTMLInputElement).files![0];
                this.$.meme.dispatchEvent(new CustomEvent('new-image', { detail: window.URL.createObjectURL(file) }));
                // TODO URL.revokeObjectURL((e as CustomEvent).detail);
            }
        }, false);
    }

    static get properties() {
        return {
            src: { type: String, reflectToAttribute: true, notify: true },
            saturation: { type: Number, reflectToAttribute: true, notify: true },
            contrast: { type: Number, reflectToAttribute: true, notify: true },
            brightness: { type: Number, reflectToAttribute: true, notify: true },
            scale: { type: Number, reflectToAttribute: true, notify: true },
            jpegQuality: { type: Number, reflectToAttribute: true, notify: true },
            totalJpegs: { type: Number, reflectToAttribute: true, notify: true },
            useOverlay: { type: Number, reflectToAttribute: true, notify: true },
            noise: { type: Number, reflectToAttribute: true, notify: true },
            hueRotate: { type: Number, reflectToAttribute: true, notify: true }
        }
    }

    static get template() {
        return html`
        <style>
        :host { 
            display: block;
        }
        #chooseFile {
            display: none;
        }
        #controls {
            display: block;
        }
        #buttons button {
            margin: 1em;
        }
        </style>
        
        <fried-meme
            id="meme"
            src=[[src]]
            saturate={{saturation}}
            contrast={{contrast}}
            brightness={{brightness}}
            hue-rotate={{hueRotate}}
            scale={{scale}}
            jpeg-quality={{jpegQuality}}
            total-jpegs={{totalJpegs}}
            use-overlay={{useOverlay}}
            noise={{noise}}
        ></fried-meme>

        <input type="file" id="chooseFile">

        <div id="controls">
            <ranged-input class="vertical"
                label="Saturation" 
                value={{saturation}}
                min=0 max=4 step=0.1 
            ></ranged-input>

            <ranged-input class="vertical"
                label="Contrast" 
                value={{contrast}}
                min=0 max=10 step=0.5 
            ></ranged-input>

            <ranged-input class="vertical"
                label="Brightness" 
                value={{brightness}}
                min=0 max=10 step=0.5 
            ></ranged-input>

            <ranged-input class="vertical"
                label="Quality" 
                value={{jpegQuality}}
                min=0 max=1 step=0.05 
            ></ranged-input>

            <ranged-input class="vertical"
                label="Noise" 
                value={{noise}}
                min=0 max=1 step=0.01
            ></ranged-input>

            <ranged-input class="vertical"
                label="Iterations" 
                value={{totalJpegs}}
                min=1 max=50 step=1
            ></ranged-input>

            <ranged-input class="vertical"
                label="Hue Rotate" 
                value={{hueRotate}}
                min="-180" max="180" step="10"
            ></ranged-input>

            <div id="buttons">
                <button id="load">Load</button>
                <button id="save">Save</button>
            </div>
        </div>
        `;
    }

}

