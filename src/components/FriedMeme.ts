import { CanvasRenderingContext2DExtended } from '../lib/CanvasRenderingContext2DExtended.interface';
import { PolymerElement, html } from '@polymer/polymer/polymer-element';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

export class FriedMeme extends PolymerElement {
    public emojis = ['🤑', '😭', '😨', '😧', '😱', '😫', '😩', '😃', '😄', '😭', '😆', '😢', '😭'];

    static DebounceMs = 250;

    private _loaded = false;
    private _running = false;

    private img!: HTMLImageElement;
    private canvas!: HTMLCanvasElement;
    private ctx!: CanvasRenderingContext2DExtended;
    private originalImg!: HTMLImageElement;
    private width!: number;
    private height!: number;
    private jpegItteration!: number;

    private blurFilterId = 'blurFilterId';
    private convFilterId = 'convFilterId';
    public convFilterKernel = `
        0  -1   0
       -1   5  -1
        0  -1   0
    `;

    private numberOfDips = 1;
    private totalJpegs = 1;
    private jpegQuality = 0.01; // 0 - 1
    private scale = 0.9;
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
            saturate: { type: Number, reflectToAttribute: true }, // 1 is default
            contrast: { type: Number, reflectToAttribute: true }, // 1 is default
            numberOfDips: { type: Number },
            totalJpegs: { type: Number },
            jpegQuality: { type: Number }, // 0 - 1
            scale: { type: Number },
            blurStdDeviation: { type: Number }, // 0 - 1
            brightness: { type: Number }, // 1 is default
            hueRotate: { type: Number }, // 0 (deg) is default
            useSharpness: { type: Boolean },
            noise: { type: Number }, // 0-1
            globalCompositeOperation: { type: String },
            globalCompositeAlpha: { type: Number },
            addEmojiBefore: { type: Boolean },
            addEmojiAfter: { type: Boolean },
            useOverlay: { type: Boolean }
        }
    }

    static get observers() {
        return [
            '_process(' 
            + Object.keys(FriedMeme.properties).join(',')
            + ')'
        ]
    }

    connectedCallback() {
        super.connectedCallback();
        (<HTMLImageElement>this.$.srcimg).onload = () => { 
            this._loaded = true;
            this._process(); 
        };
    }

    private async _process() {
        console.log('Enter _process');

        if (! this._loaded || this._running) {
            console.log('Bail from _process:: loaded=%s, running=%s', this._loaded, this._running);
            return;
        }

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
        console.log('Leave _process');
    }

    private async _fry(currentDip = 1) {
        console.log('Enter _fry');
        this._running = true;

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

        this._running = false;
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

        console.log(this.ctx.filter);

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
        // this.globalCompositeOperation;
        // return;
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
        // this._resize(this.width * this.scale, this.height * this.scale);
        // this._resize(this.width, this.height);
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

    static get template() {
        // return html`${view}`; Polymer bug prevents this working.
        return html`
        <style>
            :host {
                display: block;
            }
            svg {
                width: 0; height: 0;
            }
            img {
                box-shadow: 0pt 2pt 2pt 2pt rgba(0,0,0,0.22);
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
        
        <img id="srcimg" 
        src="data:image/jpeg;base64,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" />`;
    }
}
