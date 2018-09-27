/**
 * Also listens for these custom events:
 * 
 * * `new-image` where `Event.detail` is a Base64-encoded data URL for the image.
 
 * * `save-image`
 * 
 * * `rotate45`
 */
import { CanvasRenderingContext2DExtended } from '../lib/CanvasRenderingContext2DExtended.interface';
import { PolymerElement, html } from '@polymer/polymer/polymer-element';
// import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

export class FriedMeme extends PolymerElement {
    public emojis = ['🤑', '😭', '😨', '😧', '😱', '😫', '😩', '😃', '😄', '😭', '😆', '😢', '😭'];

    protected loaded = false;
    protected working = false;

    private img!: HTMLImageElement;
    private lastBlob!: Blob;
    private canvas!: HTMLCanvasElement;
    private ctx!: CanvasRenderingContext2DExtended;
    private originalImg!: HTMLImageElement;
    private width!: number;
    private height!: number;
    private jpegItteration!: number;

    private blurFilterId!: string;
    private convFilterId!: string;
    public convFilterKernel!: string;
    private numberOfDips = 1;
    private totalJpegs = 1;
    private jpegQuality = 0.01; // 0 - 1
    private scale = 1;
    private blurStdDeviation = 0; // 0 - 1
    private brightness = 1; // 1 is default
    private saturate = 2; // 1 is default
    private contrast = 4; // 1 is default
    private hueRotate = 0; // 0 (deg) is default
    private useSharpness = true;
    private noise = 0.1; // 0-1
    private globalCompositeOperation = 'hard-light';
    private globalCompositeAlpha = 0.5;
    private addEmojiBefore = false;
    private addEmojiAfter = true;
    private useOverlay = false;

    static get properties() {
        return {
            src: { type: String, reflectToAttribute: true }, // 1 is default
            saturate: { type: Number }, // 1 is default
            contrast: { type: Number }, // 1 is default
            brightness: { type: Number }, // 1 is default
            hueRotate: { type: Number },
            numberOfDips: { type: Number },
            totalJpegs: { type: Number },
            jpegQuality: { type: Number }, // 0 - 1
            scale: { type: Number },
            blurStdDeviation: { type: Number }, // 0 - 1
            useSharpness: { type: Boolean },
            noise: { type: Number }, // 0-1
            globalCompositeOperation: { type: String },
            globalCompositeAlpha: { type: Number },
            addEmojiBefore: { type: Boolean },
            addEmojiAfter: { type: Boolean },
            useOverlay: { type: Boolean },
            blurFilterId: { type: String, value: 'blurFilterId' },
            convFilterId: { type: String, value: 'convFilterId' },
            convFilterKernel: {
                type: String,
                value: `
                     0  -1   0
                    -1   5  -1
                     0  -1   0
                `
            }

        }
    }

    static get template() {
        // return html`${view}`; Polymer bug prevents this working.
        return html`
        <style>
            :host {
                display: inline-block;
            }
            svg {
                width: 0; height: 0;
            }
            img {
                object-fit: scale-down;
                max-width: 100vw;
                max-height: 50vh;
            }
        </style>
        
        <svg>
            <filter id="[[convFilterId]]">
                <feConvolveMatrix order="3 3" preserveAlpha="true" kernelMatrix="[[convFilterKernel]]" />
            </filter>
            <filter id="[[blurFilterId]]">
                <feGaussianBlur in="SourceGraphic" stdDeviation="[[blurStdDeviation]]" />
            </filter>
        </svg>
        
        <img id="srcimg" src="[[src]]" />
        `;
    }

    static get observers() {
        return [
            '_propertiesUpdated('
            + Object.keys(FriedMeme.properties).join(',')
            + ')'
        ]
    }

    ready() {
        super.ready();
        this.addEventListener('rotate45', () => {
            this.rotate45();
        });

        this.addEventListener('save-image', () => {
            this.saveImage();
        });

        this.addEventListener('new-image', (e: CustomEvent | Event) => {
            this.img.src = (this.$.srcimg as HTMLImageElement).src = (e as CustomEvent).detail;
            // TODO URL.revokeObjectURL( (e as CustomEvent).detail );
            this.connectedCallback();
        });
    }


    _propertiesUpdated() {
        console.log('Enter _propertiesUpdated');
        if (this.originalImg) {
            console.log('Set srcimg to ', this.originalImg.src);
            (this.$.srcimg as HTMLImageElement).src = this.originalImg.src;
            this.connectedCallback();
        }
    }

    connectedCallback() {
        super.connectedCallback();
        (this.$.srcimg as HTMLImageElement).onload = () => {
            this.loaded = true;
            this._processChangedProperties();
        };
    }

    private async _processChangedProperties() {
        console.log('Enter _processChangedProperties');

        if (!this.loaded || this.working) {
            console.log('Bail from _processChangedProperties:: loaded=%s, running=%s', this.loaded, this.working);
            return;
        }

        document.body.style.cursor = 'wait';
        this.working = true;

        this.img = this.$.srcimg as HTMLImageElement;
        this.img.onload = null;
        this.canvas = document.createElement('canvas');
        // What size to opeate upon...?
        this.width = this.canvas.width = this.img.width;
        this.height = this.canvas.height = this.img.height;
        this.ctx = this.canvas.getContext('2d')! as CanvasRenderingContext2DExtended;

        this.ctx.drawImage(this.img, 0, 0, this.width, this.height);

        this.originalImg = new Image();
        this.originalImg.src = this.img.src;
        await this._fry();
        console.log('Leave _processChangedProperties');
    }

    private async _fry(currentDip = 1) {
        console.log('Enter _fry');
        this.working = true;

        if (this.numberOfDips > 1) {
            throw new Error('Only supporting one dip now');
        }

        if (this.addEmojiBefore) {
            this._addEmoji();
        }

        await this._filterImage(
            // currentDip + 1 === this.numberOfDips
        );

        for (this.jpegItteration = 1; this.jpegItteration <= this.totalJpegs; this.jpegItteration++) {
            await this._lossySave();
        }

        // this._messitMore();

        if (currentDip < this.numberOfDips) {
            await this._fry(currentDip + 1);
        }

        if (this.useOverlay) {
            this._overlay();
        }

        if (this.addEmojiAfter) {
            this._addEmoji();
        }

        await this._losslessSave();

        document.body.style.cursor = 'default';
        this.working = false;
        console.log('Leave _fry');
    }

    private async _filterImage(
        // withEmoji: boolean = false
    ) {
        this.ctx.filter = ''
            + `saturate(${this.saturate}) `
            + (this.useSharpness ? `url("#${this.convFilterId}") ` : '')
            + `brightness(${this.brightness}) 
               contrast(${this.contrast}) 
               hue-rotate(${this.hueRotate}deg) `
            + (this.blurStdDeviation > 0 ? `url("#${this.blurFilterId}") ` : '')
            ;

        console.log('filter =', this.ctx.filter);
        console.log('globalCompositeOperation=',this.globalCompositeOperation);

        this.ctx.drawImage(this.img, 0, 0, this.width, this.height);

        if (this.noise > 0) {
            this.addNoise();
        }

        // if (withEmoji) {
        //     this._addEmoji();
        // }

        const canvas2: HTMLCanvasElement = document.createElement('canvas');
        canvas2.width = this.width;
        canvas2.height = this.height;
        const ctx2: CanvasRenderingContext2DExtended = canvas2.getContext('2d')! as CanvasRenderingContext2DExtended;
        ctx2.filter = `url("#${this.convFilterId}")  `;
        ctx2.drawImage(this.canvas, 0, 0, this.width, this.height);
        this.canvas = canvas2;
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation
    private _overlay() {
        const canvas: HTMLCanvasElement = document.createElement('canvas');
        const ctx: CanvasRenderingContext2DExtended = canvas.getContext('2d')! as CanvasRenderingContext2DExtended;
        canvas.width = this.width;
        canvas.height = this.height;
        ctx.save();

        // ctx.drawImage(this.originalImg, 0, 0, this.width, this.height);
        // ctx.globalCompositeOperation = 'overlay'; this.globalCompositeOperation;
        // ctx.globalAlpha = 0.9;

        ctx.drawImage(this.canvas, 0, 0, this.width, this.height);

        ctx.globalCompositeOperation = this.globalCompositeOperation;
        ctx.globalAlpha = this.globalCompositeAlpha;
        ctx.drawImage(this.originalImg, 0, 0, this.width, this.height);

        ctx.restore();
        this.canvas = canvas;
        this.ctx = ctx;
    }

    private async _losslessSave() {
        await this._saveToImg('image/png', 1);
    }

    private _resize(width: number, height: number) {
        let canvas: HTMLCanvasElement = document.createElement('canvas');
        let ctx: CanvasRenderingContext2DExtended = canvas.getContext('2d')! as CanvasRenderingContext2DExtended;
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(this.canvas,
            0, 0, this.canvas.width, this.canvas.height,
            0, 0, canvas.width, canvas.height,
        );
        this.canvas = canvas;
        this.ctx = ctx;
    }

    private async _lossySave() {
        // Make even worse:
        if (this.scale !== 1) {
            this._resize(this.width * this.scale, this.height * this.scale);
            this._resize(this.width, this.height);
        }
        const quality = Math.max(0, this.jpegQuality + Math.log(this.jpegItteration) * 0.5);
        console.log('quality', quality);
        await this._saveToImg(
            'image/jpeg',
            quality
        );
    }

    private _saveToImg(mimeType: string = 'image/jpeg', quality: number = this.jpegQuality) {
        return new Promise((resolve, reject) => {
            this.canvas.toBlob(
                async (blob) => {
                    if (blob === null) {
                        reject(new TypeError(`_lossySave expected a blob`));
                    }
                    await this._replaceImgWithJpegBlob(blob!);
                    resolve();
                },
                mimeType,
                quality
            );
        });
    }

    private _replaceImgWithJpegBlob(blob: Blob) {
        return new Promise((resolve, reject) => {
            this.lastBlob = blob;
            const url = URL.createObjectURL(blob);
            const previousOnLoad = this.img.onload;
            const previousOnError = this.img.onerror;
            this.img.onerror = reject;
            this.img.onload = () => {
                URL.revokeObjectURL(url);
                this.ctx.drawImage(this.img, 0, 0, this.width, this.height, 0, 0, this.width, this.height);
                this.img.onerror = previousOnError;
                this.img.onload = previousOnLoad;
                resolve();
            };
            this.img.src = url;
        });
    }

    private _addEmoji() {
        this.ctx.save();

        const minSize = this.canvas.height / 8;
        const maxSize = this.canvas.height / 4;
        const textSize = Math.floor(Math.random() * (maxSize - minSize)) + minSize;

        this.ctx.globalAlpha = (Math.random() + 0.2) / 0.8;
        this.ctx.font = `${textSize}px Archivo Black`;

        const emoji = this.emojis[Math.floor(Math.random() * this.emojis.length)];

        const x = Math.floor(Math.random() * (this.width - textSize));
        const y = Math.floor(Math.random() * (this.height - textSize)) + textSize;
        this.ctx.translate(x, y);

        this.ctx.rotate(Math.random() * (Math.random() >= 0.5 ? 1 : -1));
        this.ctx.fillText(emoji, 0, 0); // x, y

        this.ctx.restore();
    }


    // private getColorIndicesForCoord(x: number, y: number, width: number) {
    //     const red = y * (width * 4) + x * 4;
    //     return [red, red + 1, red + 2, red + 3];
    // };

    // private _messitMore (ctx: CanvasRenderingContext2DExtended){
    //     const imgData = ctx.getImageData(0, 0, this.img.width, this.img.height);
    //     const T = 128;

    //     let x = 0;
    //     let y = 0;

    //     for (var i = 0; i < imgData.data.length; i += 4) {

    //         x++ if
    //         const [r, g, b, a] = this.getColorIndicesForCoord(x, y, this.img.width);
    //         let r = imgData.data[i];
    //         let g = imgData.data[i + 1];
    //         let b = imgData.data[i + 2];
    //         let a = imgData.data[i + 3];

    //         if (r > T && g > T && b > T) {
    //             imgData.data[i] = 255;
    //             imgData.data[i + 1] = 255;
    //             imgData.data[i + 2] = 255;
    //         }
    //     }

    //     ctx.putImageData(imgData, 0, 0);
    // }

    private randomNoise(width: number, height: number) {
        const canvas: HTMLCanvasElement = document.createElement('canvas');
        const ctx: CanvasRenderingContext2DExtended = canvas.getContext('2d')! as CanvasRenderingContext2DExtended;
        canvas.width = width;
        canvas.height = height;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let i = 0;
        while (i < imageData.data.length) {
            imageData.data[i++] = imageData.data[i++] = imageData.data[i++] = (Math.random() > 0.8 ? 255 : 0);
        }
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    private addNoise() {
        const noiseCanvas = this.randomNoise(this.width, this.height);
        this.ctx.save();
        this.ctx.globalAlpha = this.noise;

        for (let size = 4; size <= noiseCanvas.width; size *= 2) {
            let x = Math.floor(Math.random() * noiseCanvas.width) - size;
            let y = Math.floor(Math.random() * noiseCanvas.height) - size;
            this.ctx.drawImage(noiseCanvas, x, y, size, size, 0, 0, this.width, this.height);
        }

        this.ctx.restore();
    }

    /** Saves at display size, not original size */
    private saveImage() {
        const url = URL.createObjectURL(this.lastBlob);
        const a = document.createElement('a');
        a.setAttribute('download', 'true');
        a.setAttribute('href', url );
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        a.remove();
    }

    private rotate45(){
        const parsed = (this.$.srcimg as HTMLElement).style.transform!.match(/rotate\((\d+)deg\)/);
        let deg = parsed? parseInt(parsed[1]) + 90 : 90;
        if (deg > 270) {
            deg = 0;
        }
        (this.$.srcimg as HTMLElement).style.transform = `rotate(${deg}deg)`;
    }

}
