import "@polymer/app-layout/app-drawer-layout/app-drawer-layout";
import "@polymer/app-layout/app-drawer/app-drawer";
import { AppDrawerElement } from "@polymer/app-layout/app-drawer/app-drawer";
import "@polymer/app-layout/app-scroll-effects/app-scroll-effects";
import "@polymer/app-layout/app-toolbar/app-toolbar";
import "@polymer/iron-icons/iron-icons";
import "@polymer/paper-checkbox/paper-checkbox";
import "@polymer/paper-dropdown-menu/paper-dropdown-menu";
import "@polymer/paper-icon-button/paper-icon-button";
import "@polymer/paper-item/paper-item";
import "@polymer/paper-listbox/paper-listbox";
import "@polymer/paper-slider/paper-slider";
import "@polymer/polymer/lib/elements/dom-repeat";
import { afterNextRender } from "@polymer/polymer/lib/utils/render-status.js";
import { setPassiveTouchGestures } from "@polymer/polymer/lib/utils/settings";
import { PolymerElement } from "@polymer/polymer/polymer-element";
import * as view from "./Frier.template.html";
import { getTemplate } from "./lib/getTemplate";

setPassiveTouchGestures(true);

export class MemeFrier extends PolymerElement {
    public addEmojiAfter = true;
    public addEmojiBefore = true;
    public blurStdDeviation = 0;
    public brightness = 2;
    public contrast = 4;
    public globalCompositeOperation = "hard-light";
    public globalCompositeOperationIndex!: number;
    public globalCompositeOperations!: string[];
    public hueRotate = 0;
    public jpegQuality = 0.1;
    public noise = 0.2;
    public saturation = 2;
    public scale = 1; // 0.5;
    public src!: string;
    public totalJpegs = 22;

    static get template() {
        return getTemplate(view);
    }

    public connectedCallback() {
        super.connectedCallback();

        ["addEmojiBefore", "addEmojiAfter"].forEach((id) => {
            this.$[id].addEventListener("change", (e: Event) => {
                this[id] = (this.$[id] as HTMLInputElement).checked;
            });
        });

        this.$.rotate45.addEventListener("tap", (e: Event) => {
            (this.$.meme as HTMLElement).dispatchEvent(new CustomEvent("rotate45"));
        });

        this.$.save.addEventListener("tap", (e: Event) => {
            (this.$.meme as HTMLElement).dispatchEvent(new CustomEvent("save-image"));
        });

        this.$.load.addEventListener("tap", (e: Event) => {
            (this.$.chooseFile as HTMLElement).click();
        });

        this.globalCompositeOperationIndex = this.globalCompositeOperations.indexOf(this.globalCompositeOperation);

        this.$.globalCompositeOperations.addEventListener("iron-select", (e: Event) => {
            this.globalCompositeOperation = (e as CustomEvent).detail.item.innerText;
            if (! ((this.$.drawer as unknown) as AppDrawerElement).persistent) {
                ((this.$.drawer as unknown) as AppDrawerElement).close();
            }
        });

        this.$.drawer.addEventListener("tap", (e: Event) => {
            if (!((this.$.drawer as unknown) as AppDrawerElement).persistent) {
                console.log("tapped ", (e.target as HTMLElement).id);
                if ((e.target as HTMLElement).id.toString() !== "globalCompositeOperation") {
                    ((this.$.drawer as unknown) as AppDrawerElement).close();
                }
            }
        });

        this.$.chooseFile.addEventListener("change", (e: Event) => {
            if (e && e.target && (e.target as HTMLInputElement).files && (e.target as HTMLInputElement).files!.length) {
                const file = (e.target as HTMLInputElement).files![0];
                this.$.meme.dispatchEvent(new CustomEvent("new-image", {
                    detail: URL.createObjectURL(file),
                },
                ));
            }
        }, false);

        afterNextRender(this, () => {
            // If not narrow
            if (((this.$.drawer as unknown) as AppDrawerElement).persistent) {
                console.info("Not narrow, so touch opens image");
                this.$.meme.addEventListener("tap", (e: Event) => {
                    (this.$.chooseFile as HTMLElement).click();
                });

                // Drag and drop for non-narrow
                this.$.meme.addEventListener("dragover", (e) => {
                    e.preventDefault();
                });

                this.$.meme.addEventListener("drop", (e) => { // (e: DragEvent) produces type error
                    console.log("drop", e);
                    console.debug(((e as DragEvent).dataTransfer!).items[0]);
                    e.preventDefault();
                    if (((e as DragEvent).dataTransfer!).items &&
                        ((e as DragEvent).dataTransfer!).items[0].kind === "file"
                    ) {
                        const file = ((e as DragEvent).dataTransfer!).items[0].getAsFile();
                        this.$.meme.dispatchEvent(
                            new CustomEvent("new-image", {
                                detail: URL.createObjectURL(file),
                            }),
                        );
                    }
                }, false);
            } else {
                console.info("Is narrow, touch opens drawer");
                this.$.meme.addEventListener("tap", (e: Event) => {
                    ((this.$.drawer as unknown) as AppDrawerElement).open();
                });
            }
        });
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
            globalCompositeOperationIndex: { type: Number },
            globalCompositeOperations: {
                type: Array,
                value() {
                    return [
                        "", "hard-light", "soft-light", "overlay",
                        "lighter", "multiply", "screen", "darken", "lighten",
                        "color-dodge", "color-burn",
                        "hue", "saturation", "color", "luminosity",
                    ];
                },
            },
        };
    }
}
