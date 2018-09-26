import { PolymerElement, html } from '@polymer/polymer/polymer-element';

export class RangedInput extends PolymerElement {
    value!: string | number;
    label!: string;

    static get properties() {
        return {
            value: { type: Number, reflectToAttribute: true, notify: true },
            label: { type: String },
            id: { type: String },
            min: { type: Number },
            max: { type: Number },
            step: { type: Number }
        };
    }

    static get template() {
        return html`
        <style>
            :host {
                display: inline-block;
                text-align: center;
                margin: 0;
                padding: 0;
                font-face: caption;
                width: 4em;
            }
            :host(.vertical) {
                transform-origin: 100% 100%;
                transform: rotate(-90deg);
            }
            :host label, :host input {
                display: block;
            }
        </style>

        <label> 
            {{label}}
        </label>
        <input on-input="inputHandler" type="range" value="{{value::input}}" min="[[min]]" max="[[max]]" step="[[step]]">
        `;
    }

    inputHandler() {
        this.dispatchEvent(new CustomEvent('change', { detail: { value: this.value } }));
    }
}

