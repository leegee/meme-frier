import { PolymerElement } from '@polymer/polymer/polymer-element';
import { getTemplate } from './lib/getTemplate';
import * as view from './RangedInput.template.html';

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
        return getTemplate(view);
    }

    inputHandler() {
        this.dispatchEvent(new CustomEvent('change', { detail: { value: this.value } }));
    }
}

