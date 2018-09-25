import { PolymerElement, html } from '@polymer/polymer/polymer-element';

export class RangedInput extends PolymerElement {
    value!: string | number;
    vertical!: boolean;
    label!: string;

    static get properties() {
        return {
            value: { type: Number, reflectToAttribute: true, notify: true },
            label: { type: String },
            id: { type: String },
            min: { type: Number },
            max: { type: Number },
            step: { type: Number },
            vertical: { type: Boolean, reflectToAttribute: true },
            class: {
                type: String,
                value: () => {
                    return this.hasOwnProperty('vertical') ? 'slider-wrapper-v' : ''
                }
            }
        };
    }

    static get template() {
        return html`
        <style>
           .slider-wrapper {
                text-align: center;
                display: block;
                border: 1px solid red;
                float: left;
                padding: 0;
                width: 150pt;
                height: 40pt;
                margin: 0;
            }
            .slider-wrapper-v {
                background: red;
                width: 40pt;
                height: 150pt;
                transform-origin: 75px 75px;
                transform: rotate(-90deg);
            }
            ..slider-wrapper label, .slider-wrapper input[type=range] {
                display: block;
            }
        </style>
        <div class="slider-wrapper" id="[[id]]">
            <label> 
                {{label}}
                <input class="{{class}}" on-input="inputHandler" type="range" value="{{value::input}}" min="[[min]]" max="[[max]]" step="[[step]]">
            </label>
        </div>
        `;
    }

    inputHandler() {
        console.log(`Change to ${this.label}`, this.value)
        this.dispatchEvent(new CustomEvent('change', { detail: { value: this.value } }));
    }
}

