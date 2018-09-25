import { PolymerElement, html } from '@polymer/polymer/polymer-element';
import { RangedInput } from './RangedInput';

export class MemeFrier extends PolymerElement {
    static DebounceMs = 250;

    saturation: number | string = 2;
    contrast: number | string = 4;
    _lastCallTime: number = 0;
    _lastCallEvent: number | null = null;

    constructor() {
        super();
    }
    static get properties() {
        return {
            saturation: { type: Number, reflectToAttribute: true, notify: true },
            contrast: { type: Number, reflectToAttribute: true, notify: true },
        }
    }

    static get template() {
        return html`
        <fried-meme 
            saturate={{saturation}}
            contrast={{contrast}}
        ></fried-meme>
        <ranged-input vertical  
            id="saturate"  
            label="Saturation" 
            on-change="changeHandler"
            value={{saturation}}
            min=0 max=4 
            step=0.1 
        ></ranged-input>
        <ranged-input vertical=true
            id="contrast" 
            label="Contrast" 
            on-change="changeHandler" 
            value={{contrast}}
            min=0 max=10 
            step=0.5 
        ></ranged-input>
        `;
    }

    changeHandler(e) {
        // Make sure there is a delay in action after this call
        const now = new Date().getTime();
        // If there has NOT been a delay since the last call, clear last call and
        if (now < this._lastCallTime + MemeFrier.DebounceMs && this._lastCallEvent) {
            clearTimeout( this._lastCallEvent );
        }
        // call to update meme in a while (unless we get recalled with that while)
        this._lastCallEvent = setTimeout( () => { this._update() }, MemeFrier.DebounceMs );
    }

    private _update() {
        console.log('Update the meme!', this.saturation, this.contrast);
    }
}

