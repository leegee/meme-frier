import { PolymerElement, html } from '@polymer/polymer/polymer-element';
import {} from '@polymer/polymer/lib/elements/dom-repeat';

export class MemeFrier extends PolymerElement {
    src!: string;
    saturation = 2;
    contrast = 4;
    brightness = 2;
    scale = 1;
    jpegQuality = 0.9;
    totalJpegs = 22;
    noise = 0.2;
    hueRotate = 0;
    useOverlay = true;
    addEmojiBefore = true;
    addEmojiAfter = true;
    globalCompositeOperation = 'hard-light';
    globalCompositeOperations!: Array<string>;

    static get template() {
        return html`
        <style>
        :host { 
            display: block;
        }
        .group:after {
            content: "";
            display: table;
            clear: both;
        }
        #chooseFile {
            display: none;
        }
        #controls {
            display: block;
            text-align: left;
            background: #0003;
            padding: 1em;
            margin-top: 1em;
            position: relative; 
        }
        #sliders {
            display: block;
            float: left;
            height: 10em;
        }
        ranged-input {
            text-align: center;
            margin: 1em;
        }
        #buttons {
            display: inline-block;
        }
        #buttons button {
            margin: 1em;
        }
        </style>

        <input type="file" id="chooseFile">

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
            add-emoji-before={{addEmojiBefore}}
            add-emoji-after={{addEmojiAfter}}
            noise={{noise}}
            global-composite-operation={{globalCompositeOperation}}
        ></fried-meme>

        <div id="controls" class="group">
            <div id="sliders" class="group">
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
            </div>

            <div id="buttons" class="group">

                <select id="globalCompositeOperations"></select>

                <p>
                    <label>
                        <input id="useOverlay" type="checkbox" checked="{{useOverlay}}">
                        Use overlay
                    </label>
                </p>
                <p>
                    <label>
                        <input id="addEmojiBefore" type="checkbox" checked="{{addEmojiBefore}}">
                        Emoji before
                    </label>
                    <label>
                        <input id="addEmojiAfter" type="checkbox" checked="{{addEmojiAfter}}">
                        Emoji after
                    </label>
                </p>

                <p>
                    <button id="rotate45">Rotate</button>
                    <button id="load">Load</button>
                    <button id="save">Save</button>
                </p>
            </div>
        </div>
        `;
    }


    connectedCallback() {
        super.connectedCallback();

        const select = this.$.globalCompositeOperations;
        this.globalCompositeOperations.forEach( (i) => {
            const option = document.createElement('option');
            option.textContent = i;
            option.value = i;
            if (i === this.globalCompositeOperation) {
                option.selected = true;
            }
            select.appendChild(option);
        });      

        this.$.rotate45.addEventListener("click", (e: Event) => {
            (this.$.meme as HTMLElement).dispatchEvent(new CustomEvent("rotate45"));
        });

        this.$.save.addEventListener("click", (e: Event) => {
            (this.$.meme as HTMLElement).dispatchEvent(new CustomEvent("save-image"));
        });

        this.$.load.addEventListener("click", (e: Event) => {
            (this.$.chooseFile as HTMLElement).click();
        });

        this.$.meme.addEventListener("click", (e: Event) => {
            (this.$.chooseFile as HTMLElement).click();
        });

        ['useOverlay', 'addEmojiBefore', 'addEmojiAfter'].forEach((id) => {
            this.$[id].addEventListener("change", (e: Event) => {
                this[id] = (this.$[id] as HTMLInputElement).checked;
            });
        });

        this.$.chooseFile.addEventListener("change", (e: Event) => {
            if (e && e.target && (e.target as HTMLInputElement).files && (e.target as HTMLInputElement).files!.length) {
                const file = (e.target as HTMLInputElement).files![0];
                this.$.meme.dispatchEvent(new CustomEvent('new-image', { detail: window.URL.createObjectURL(file) }));
                // TODO URL.revokeObjectURL((e as CustomEvent).detail);
            }
        }, false);

        this.$.meme.addEventListener("drop", function (e) { // (e: DragEvent) produces type error
            console.log('drop');
            e.preventDefault();
            if ((e as DragEvent).dataTransfer.items && (e as DragEvent).dataTransfer.items[0].kind === 'file') {
                const dropped = (e as DragEvent).dataTransfer.items[0].getAsString((str) => {
                    console.log(str, dropped);
                });
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
            hueRotate: { type: Number, reflectToAttribute: true, notify: true },
            globalCompositeOperation: { type: String, reflectToAttribute: true, notify: true },
            globalCompositeOperations: { 
                type: Array,
                value() {
                    return [
                        'hard-light', 'soft-light', 'overlay'
                    ];
                }
            }
        }
    }
}

