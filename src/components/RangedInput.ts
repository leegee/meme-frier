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
                border: 1px solid gray;
                display: inline-block;
                text-align: center;
                margin: 0;
                padding: 0;
                width: 150pt;
                height: 40pt;
            }
            :host(.vertical) {
                width: 40pt;
                height: 150pt;
                transform-origin: 75pt 75pt;
                transform: rotate(-90deg);
            }
            label, input {
                display: inline-block;
            }
        </style>
        <label> 
            {{label}}
            <input on-input="inputHandler" type="range" value="{{value::input}}" min="[[min]]" max="[[max]]" step="[[step]]">
        </label>
        `;
    }

    inputHandler() {
        this.dispatchEvent(new CustomEvent('change', { detail: { value: this.value } }));
    }
}

