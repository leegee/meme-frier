/**
 * Also listens for these custom events:
 * 
 * * `new-image` where `Event.detail` is a Base64-encoded data URL for the image.
 
 * * `save-image`
 * 
 * * `rotate45`
 */
import { CanvasRenderingContext2DExtended } from './lib/CanvasRenderingContext2DExtended.interface';
import { PolymerElement } from '@polymer/polymer/polymer-element';

import { Fisheye } from './lib/Fisheye';
import { getTemplate } from './lib/getTemplate';
import * as view from './FriedMeme.template.html';

export class FriedMeme extends PolymerElement {
    public emojis = ['🤑', '😭', '😨', '😧', '😱', '😫', '😩', '😃', '😄', '🤡', '👌'];

    protected loaded = false;
    protected working = false;

    private img!: HTMLImageElement;
    private srcImgClass = 'portrait';
    private lastBlob!: Blob;
    private canvas!: HTMLCanvasElement;
    private ctx!: CanvasRenderingContext2DExtended;
    private originalImg!: HTMLImageElement;
    private width!: number;
    private height!: number;
    private jpegItteration!: number;
    private fisheyeInstance!: Fisheye;
    private fisheyeExitHandler!: any; // MouseEvent; 
    private fisheyeKeyHandler!: any; // KeyboardEvent;

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
        return getTemplate(view);
    }

    static get observers() {
        return [
            '_propertiesUpdated('
            + Object.keys(FriedMeme.properties).join(',')
            + ')'
        ]
    }

    ready(): void {
        super.ready();

        this.addEventListener("orientationchange", function () {
            alert("the orientation of the device is now " + screen.orientation.angle);
        });

        this.addEventListener('fisheye', () => {
            this.beginFisheye();
        });

        this.addEventListener('rotate45', () => {
            this.rotate45();
        });

        this.addEventListener('save-image', () => {
            this.saveImage();
        });

        this.addEventListener('new-image', (e: CustomEvent | Event) => {
            this.newImage((e as CustomEvent).detail);
        });
    }

    _propertiesUpdated(): void {
        if (!this.working) {
            console.log('Enter _propertiesUpdated');
            if (this.originalImg) {
                console.log('Set srcimg to ', this.originalImg.src);
                (this.$.srcimg as HTMLImageElement).src = this.originalImg.src;
                this.connectedCallback();
            }
        }
    }

    connectedCallback(): void {
        super.connectedCallback();
        (this.$.srcimg as HTMLImageElement).onload = () => {
            this.imageLoaded();
        };
    }

    imageLoaded(): void {
        this.loaded = true;
        this.working = false;
        (this.$.srcimg as HTMLElement).style.rotate = '0deg';

        delete (this.$.srcimg as HTMLImageElement).width;
        delete (this.$.srcimg as HTMLImageElement).height;
        delete (this.$.srcimg as HTMLElement).style.width;
        delete (this.$.srcimg as HTMLElement).style.height;

        if ((this.$.srcimg as HTMLImageElement).width > (this.$.srcimg as HTMLImageElement).height) {
            this.srcImgClass = 'landscape';
        } else {
            this.srcImgClass = 'portrait';
        }

        this.img = this.$.srcimg as HTMLImageElement;
        this.img.onload = null;
        this.originalImg = new Image();
        this.originalImg.src = this.img.src;

        this._processChangedProperties();
    }

    private async _processChangedProperties(): Promise<void> {
        console.log('Enter _processChangedProperties');

        if (!this.loaded || this.working) {
            console.log('Bail from _processChangedProperties:: loaded=%s, running=%s', this.loaded, this.working);
            return;
        }

        document.body.style.cursor = 'wait';
        this.working = true;

        this.canvas = document.createElement('canvas');

        this.width = this.canvas.width = this.img.width;
        this.height = this.canvas.height = this.img.height;

        this.ctx = this.canvas.getContext('2d')! as CanvasRenderingContext2DExtended;
        this.ctx.drawImage(this.img, 0, 0, this.width, this.height);

        await this._fry();
        console.log('Leave _processChangedProperties');
    }

    private async _fry(currentDip = 1): Promise<void> {
        console.log('Enter _fry');
        this.working = true;

        if (this.numberOfDips > 1) {
            throw new Error('Only supporting one dip now');
        }

        if (this.addEmojiBefore) {
            this._addEmoji();
        }

        await this._filterImage();

        for (this.jpegItteration = 1; this.jpegItteration <= this.totalJpegs; this.jpegItteration++) {
            // this.status = 'Saving ' + this.jpegItteration + '/' + this.totalJpegs ;
            await this._lossySave();
        }

        // this._messitMore();

        if (currentDip < this.numberOfDips) {
            await this._fry(currentDip + 1);
        }

        if (this.globalCompositeOperation && this.globalCompositeOperation.length) {
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

    private async _filterImage(): Promise<void> {
        this.ctx.filter = ''
            + `saturate(${this.saturate}) `
            + (this.useSharpness ? `url("#${this.convFilterId}") ` : '')
            + `brightness(${this.brightness}) 
               contrast(${this.contrast}) 
               hue-rotate(${this.hueRotate}deg) `
            + (this.blurStdDeviation > 0 ? `url("#${this.blurFilterId}") ` : '')
            ;

        console.log('filter =', this.ctx.filter);
        console.log('globalCompositeOperation=', this.globalCompositeOperation);

        this.ctx.drawImage(this.img, 0, 0, this.width, this.height);

        if (this.noise > 0) {
            this.addNoise();
        }

        const canvas2: HTMLCanvasElement = document.createElement('canvas');
        canvas2.width = this.width;
        canvas2.height = this.height;
        const ctx2: CanvasRenderingContext2DExtended = canvas2.getContext('2d')! as CanvasRenderingContext2DExtended;
        ctx2.filter = `url("#${this.convFilterId}")  `;
        ctx2.drawImage(this.canvas, 0, 0, this.width, this.height);
        this.canvas = canvas2;
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation
    private _overlay(): void {
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

    private async _losslessSave(): Promise<void> {
        await this._saveToImg('image/png', 1);
    }

    private _resize(width: number, height: number): void {
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
        console.log('made size ', this.canvas.width, this.canvas.height);
    }

    private async _lossySave(): Promise<void> {
        // Make even worse:
        if (this.scale !== 1) {
            const width = this.width * this.scale;
            const height = this.height * this.scale;
            if (width > 50 && height > 50) {
                this._resize(width, height);
                this._resize(this.width, this.height);
                console.log('rescale in _lossySave');
            } else {
                console.log('no rescale, ', width, height);
            }
        }
        const quality = Math.max(0, this.jpegQuality + Math.log(this.totalJpegs - this.jpegItteration) * 0.15);
        console.log('scale/quality %s / %s', this.scale, quality);
        await this._saveToImg(
            'image/jpeg',
            quality
        );
    }

    private _saveToImg(mimeType: string = 'image/jpeg', quality: number = this.jpegQuality): Promise<void> {
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

    private _replaceImgWithJpegBlob(blob: Blob): Promise<void> {
        return new Promise((resolve, reject) => {
            this.lastBlob = blob;
            const url = URL.createObjectURL(blob);
            const previousOnLoad = this.img.onload;
            const previousOnError = this.img.onerror;
            this.img.onerror = reject;
            this.img.onload = () => {
                /* // begin debug
                const el = document.createElement('img');
                (el as HTMLImageElement).src = url;
                document.body.appendChild(el);
                // end debug */
                console.log('loaded jpeg _replaceImgWithJpegBlob');
                URL.revokeObjectURL(url);
                this.ctx.drawImage(this.img, 0, 0, this.width, this.height, 0, 0, this.width, this.height);
                this.img.onerror = previousOnError;
                this.img.onload = previousOnLoad;
                resolve();
            };
            this.img.src = url;
        });
    }

    private _addEmoji(): void {
        this.ctx.save();

        const minSize = this.canvas.height / 8;
        const maxSize = this.canvas.height / 4;
        const textSize = Math.floor(Math.random() * (maxSize - minSize)) + minSize;

        this.ctx.globalAlpha = (Math.random() + 0.2) / 0.7;
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

    private randomNoise(width: number, height: number): HTMLCanvasElement {
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

    private addNoise(): void {
        const noiseCanvas = this.randomNoise(this.width, this.height);
        this.ctx.save();
        this.ctx.globalAlpha = this.noise;

        // Roughly Perlin noise
        for (let size = 4; size <= noiseCanvas.width; size *= 2) {
            let x = Math.floor(Math.random() * noiseCanvas.width) - size;
            let y = Math.floor(Math.random() * noiseCanvas.height) - size;
            this.ctx.drawImage(noiseCanvas, x, y, size, size, 0, 0, this.width, this.height);
        }

        this.ctx.restore();
    }

    /** Saves at display size, not original size */
    private saveImage(): void {
        console.log('Enter save image');
        const url = URL.createObjectURL(this.lastBlob);
        const a = document.createElement('a');
        a.setAttribute('download', 'true');
        a.setAttribute('href', url);
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        a.remove();
    }

    private rotate45(): void {
        const parsed = (this.$.srcimg as HTMLElement).style.transform!.match(/rotate\((\d+)deg\)/);
        let deg = parsed ? parseInt(parsed[1]) + 90 : 90;
        if (deg > 270) {
            deg = 0;
        }

        const compStyles = window.getComputedStyle((this.$.srcimg as HTMLElement));
        const width = compStyles.getPropertyValue('width');
        const height = compStyles.getPropertyValue('height');
        (this.$.srcimg as HTMLElement).style.width = height;
        (this.$.srcimg as HTMLElement).style.height = width;
        (this.$.srcimg as HTMLElement).style.transform = `rotate(${deg}deg)`;
    }

    private beginFisheye(): void {
        this.working = true;
        this.fisheyeInstance = new Fisheye(
            this.$.fisheye as HTMLCanvasElement,
            this.canvas,
            this.img.getBoundingClientRect(),
            300
        );
        this.fisheyeInstance.run();
        this.fisheyeExitHandler = this.applyFisheye.bind(this);
        this.fisheyeKeyHandler = this.keysForFisheye.bind(this);
        window.addEventListener("dblclick", this.fisheyeExitHandler);
        window.addEventListener("keyup", this.fisheyeKeyHandler);
    }

    private fisheyeCleanup(){
        window.removeEventListener("dblclick", this.fisheyeExitHandler);
        window.removeEventListener("keyup", this.fisheyeKeyHandler);
        this.working = false;
        delete this.fisheyeInstance;
    }

    private async keysForFisheye(e: KeyboardEvent): Promise<void> {
         if ( e.keyCode === 27) {
            e.preventDefault();
            this.fisheyeInstance.finalise(false);
            this.fisheyeCleanup();
         }
    }

    private async applyFisheye(e: MouseEvent): Promise<void> {
        e.preventDefault();
        this.fisheyeInstance.finalise();
        await this._losslessSave();
        this.fisheyeCleanup();
    }

    newImage(src: string): void {
        this.img.src = (this.$.srcimg as HTMLImageElement).src = src;
        // TODO URL.revokeObjectURL( (e as CustomEvent).detail );
        this.connectedCallback();
    }

}
