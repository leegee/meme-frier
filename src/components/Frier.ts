import { PolymerElement, html } from '@polymer/polymer/polymer-element';
import { setPassiveTouchGestures } from '@polymer/polymer/lib/utils/settings';
import { } from '@polymer/polymer/lib/elements/dom-repeat';

import '@polymer/app-layout/app-drawer/app-drawer';
import '@polymer/app-layout/app-drawer-layout/app-drawer-layout';
import '@polymer/app-layout/app-header/app-header';
import '@polymer/app-layout/app-header-layout/app-header-layout';
import '@polymer/app-layout/app-scroll-effects/app-scroll-effects';
import '@polymer/app-layout/app-toolbar/app-toolbar';
import '@polymer/paper-icon-button/paper-icon-button';
import '@polymer/paper-slider/paper-slider';
import '@polymer/iron-icons/iron-icons';

import { getTemplate } from './lib/getTemplate';
import * as view from './Frier.template.html';

setPassiveTouchGestures(true);

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
    addEmojiBefore = true;
    addEmojiAfter = true;
    globalCompositeOperation = 'hard-light';
    globalCompositeOperations!: Array<string>;
    blurStdDeviation = 0;

    static get template() {
        return getTemplate(view);
    }


    connectedCallback() {
        super.connectedCallback();

        ['addEmojiBefore', 'addEmojiAfter'].forEach((id) => {
            this.$[id].addEventListener("change", (e: Event) => {
                this[id] = (this.$[id] as HTMLInputElement).checked;
            });
        });

        this.globalCompositeOperations.forEach((i) => {
            const option = document.createElement('option');
            option.textContent = i;
            option.value = i;
            if (i === this.globalCompositeOperation) {
                option.selected = true;
            }
            this.$.globalCompositeOperations.appendChild(option);
        });
        this.$.globalCompositeOperations.addEventListener("change", (e: Event) => {
            this.globalCompositeOperation = (e as any).path[0].value;
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

        this.$.chooseFile.addEventListener("change", (e: Event) => {
            if (e && e.target && (e.target as HTMLInputElement).files && (e.target as HTMLInputElement).files!.length) {
                const file = (e.target as HTMLInputElement).files![0];
                this.$.meme.dispatchEvent(new CustomEvent('new-image', {
                    detail: URL.createObjectURL(file)
                }
                ));
            }
        }, false);

        this.$.meme.addEventListener("dragover", (e) => {
            e.preventDefault();
        });

        this.$.meme.addEventListener("drop", (e) => { // (e: DragEvent) produces type error
            console.log('drop', e);
            console.log((e as DragEvent).dataTransfer.items[0]);
            e.preventDefault();
            if ((e as DragEvent).dataTransfer.items &&
                (e as DragEvent).dataTransfer.items[0].kind === 'file'
            ) {
                const file = (e as DragEvent).dataTransfer.items[0].getAsFile();
                this.$.meme.dispatchEvent(
                    new CustomEvent('new-image', {
                        detail: URL.createObjectURL(file)
                    })
                );
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
            noise: { type: Number, reflectToAttribute: true, notify: true },
            hueRotate: { type: Number, reflectToAttribute: true, notify: true },
            blurStdDeviation: { type: Number, reflectToAttribute: true, notify: true },
            globalCompositeOperation: { type: String, reflectToAttribute: true, notify: true },
            globalCompositeOperations: {
                type: Array,
                value() {
                    return [
                        'hard-light', 'soft-light', 'overlay',
                        'source-over', 'source-in', 'source-out', 'source-atop',
                        'destination-over', 'destination-in', 'destination-out', 'destination-atop',
                        'lighter', 'copy', 'xor', 'multiply', 'screen', 'darken', 'lighten',
                        'color-dodge', 'color-burn', 'difference', 'exclusion',
                        'hue', 'saturation', 'color', 'luminosity'
                    ];
                }
            }
        }
    }
}

