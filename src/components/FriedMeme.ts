/**
 * Also listens for these custom events:
 *
 * * `new-image` where `Event.detail` is a Base64-encoded data URL for the image.
 * * `save-image`
 * * `rotate45`
 */
import { PolymerElement } from "@polymer/polymer/polymer-element";
import "@polymer/polymer/lib/elements/dom-if";

import * as view from "./FriedMeme.template.html";
import { CanvasRenderingContext2DExtended } from "./lib/CanvasRenderingContext2DExtended.interface";
import { getTemplate } from "./lib/getTemplate";

export class FriedMeme extends PolymerElement {
  static get properties() {
    return {
      addEmojiAfter: { type: Boolean },
      addEmojiBefore: { type: Boolean },
      blurFilterId: { type: String, value: "blurFilterId" },
      blurStdDeviation: { type: Number }, // 0 - 1
      brightness: { type: Number }, // 1 is default
      contrast: { type: Number }, // 1 is default
      convFilterId: { type: String, value: "convFilterId" },
      convFilterKernel: {
        type: String,
        value: `
                  0  -1   0
                -1   5  -1
                  0  -1   0
            `
      },
      globalCompositeAlpha: { type: Number },
      globalCompositeOperation: { type: String },
      hueRotate: { type: Number },
      jpegQuality: { type: Number }, // 0 - 1
      noise: { type: Number }, // 0-1
      numberOfDips: { type: Number },
      saturate: { type: Number }, // 1 is default
      scale: { type: Number },
      src: { type: String, reflectToAttribute: true }, // 1 is default
      totalJpegs: { type: Number },
      useSharpness: { type: Boolean }
    };
  }

  static get template() {
    return getTemplate(view);
    // // Because Polymer is not quite as advertised:
    // const stringArray = [`${view}`];
    // return html({ raw: stringArray, ...stringArray } as TemplateStringsArray);
  }

  static get observers() {
    return [
      "_propertiesUpdated(" + Object.keys(FriedMeme.properties).join(",") + ")"
    ];
  }

  public emojis = [
    "🤑",
    "😭",
    "😨",
    "😧",
    "😱",
    "😫",
    "😩",
    "😃",
    "😄",
    "😭",
    "😆",
    "😢",
    "😭"
  ];
  public convFilterKernel!: string;

  protected loaded = false;
  protected working = false;

  private img!: HTMLImageElement;
  private preLensImageData!: ImageData;
  private lastBlob!: Blob;
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2DExtended;
  private debugging = false;
  private originalImg!: HTMLImageElement;
  private width!: number;
  private height!: number;
  private jpegItteration!: number;
  private lastFisheyeInputEvent!: MouseEvent | TouchEvent;

  private blurFilterId!: string;
  private convFilterId!: string;
  private numberOfDips = 1;
  private totalJpegs = 1;
  private jpegQuality = 1; // 0.01; // 0 - 1
  private scale = 1;
  private src!: string;
  private blurStdDeviation = 0; // 0 - 1
  private brightness = 1; // 1 is default
  private saturate = 2; // 1 is default
  private contrast = 4; // 1 is default
  private hueRotate = 0; // 0 (deg) is default
  private useSharpness = true;
  private noise = 0; // 0.1; // 0-1
  private globalCompositeOperation = "hard-light";
  private globalCompositeAlpha = 0.5;
  private addEmojiBefore = true;
  private addEmojiAfter = true;

  public ready() {
    super.ready();

    this.$.srcimg.addEventListener("mousemove", (e: any) =>
      this.distortionFromEvent(e as MouseEvent | TouchEvent)
    );
    this.$.srcimg.addEventListener("touchmove", (e: any) =>
      this.distortionFromEvent(e as MouseEvent | TouchEvent)
    );

    this.addEventListener("rotate45", () => this.rotate45());

    this.addEventListener("save-image", () => this.saveImage());

    this.addEventListener("new-image", (e: CustomEvent | Event) => {
      this.newImage((e as CustomEvent).detail);
    });
  }

  public _propertiesUpdated() {
    // console.debug("Enter _propertiesUpdated");
    if (this.originalImg) {
      console.debug("Set srcimg to ", this.originalImg.src);
      (this.$.srcimg as HTMLImageElement).src = this.originalImg.src;
      this.connectedCallback();
    }
  }

  public connectedCallback() {
    super.connectedCallback();
    (this.$.srcimg as HTMLImageElement).onload = () => {
      this.imageLoaded();
    };
  }

  public imageLoaded() {
    this.loaded = true;
    this.working = false;
    (this.$.srcimg as HTMLElement).style.rotate = "0deg";

    delete (this.$.srcimg as HTMLImageElement).width;
    delete (this.$.srcimg as HTMLImageElement).height;
    delete (this.$.srcimg as HTMLElement).style.width;
    delete (this.$.srcimg as HTMLElement).style.height;

    this.img = this.$.srcimg as HTMLImageElement;
    this.img.onload = null;
    this.originalImg = new Image();
    this.src = this.originalImg.src = this.img.src;

    this._processChangedProperties();
  }

  public newImage(src: string) {
    delete this.originalImg.width;
    delete this.originalImg.height;
    (this.$
      .srcimg as HTMLImageElement).src = this.originalImg.src = this.src = this.img.src = src;
    this.width = this.originalImg.width;
    this.height = this.originalImg.height;
    // this.ctx.drawImage(this.originalImg, 0, 0, this.width, this.height);
    // TODO URL.revokeObjectURL( (e as CustomEvent).detail );
    this._propertiesUpdated();
  }

  private async distortionFromEvent(e: MouseEvent | TouchEvent) {
    if (!this.working && this.loaded) {
      this.lastFisheyeInputEvent = e;
      await this.addFisheyeDistortion();
    }
  }

  private async addFisheyeDistortion() {
    if (!this.lastFisheyeInputEvent) {
      return;
    }

    if (!this.loaded || this.working) {
      console.debug(
        "addFisheyeDistortion, bail-out: loaded=%s, working=%s",
        this.loaded,
        this.working
      );
      return;
    }
    this.working = true;

    const size = 200;

    const e =
      this.lastFisheyeInputEvent instanceof TouchEvent
        ? (this.lastFisheyeInputEvent as TouchEvent).touches[0]
        : (this.lastFisheyeInputEvent as MouseEvent);

    var srcimgBoundingClientRect = this.$.srcimg.getBoundingClientRect();

    const cx: number = e.clientX - srcimgBoundingClientRect.left - 0.5 * size;
    const cy: number = e.clientY - srcimgBoundingClientRect.top - 0.5 * size;

    if (!this.preLensImageData) {
      this.preLensImageData = this.ctx.getImageData(
        0,
        0,
        this.width,
        this.height
      );
    } else {
      this.ctx.putImageData(this.preLensImageData, 0, 0);
    }

    const imgSample = this.ctx.getImageData(cx, cy, size, size);

    let pixelsCopy: number[][] = [];

    for (let i = 0; i <= imgSample.data.length; i += 4) {
      pixelsCopy.push([
        imgSample.data[i],
        imgSample.data[i + 1],
        imgSample.data[i + 2],
        imgSample.data[i + 3]
      ]);
    }

    const result = this.fisheye(pixelsCopy, size, size);

    for (let i = 0; i < result.length; i++) {
      const index = 4 * i;
      if (result[i] !== undefined) {
        imgSample.data[index + 0] = result[i][0];
        imgSample.data[index + 1] = result[i][1];
        imgSample.data[index + 2] = result[i][2];
        imgSample.data[index + 3] = result[i][3];
      }
    }

    this.ctx.putImageData(imgSample, cx, cy);

    await this._losslessSave();

    // console.debug("Saved fisheye");
    this.working = false;
  }

  // Thanks for the maths: https://codepen.io/anon/pen/yZOBpz
  private fisheye(
    srcpixels: number[][],
    width: number,
    height: number
  ): number[][] {
    const dstpixels: number[][] = srcpixels.slice();

    for (let y = 0; y < height; y++) {
      const ny = (2 * y) / height - 1;
      const ny2 = ny * ny;

      for (let x = 0; x < width; x++) {
        const nx = (2 * x) / width - 1;
        const nx2 = nx * nx;
        const r = Math.sqrt(nx2 + ny2);

        if (0.0 <= r && r <= 1.0) {
          let nr = Math.sqrt(1.0 - r * r);
          nr = (r + (1.0 - nr)) / 2.0;

          if (nr <= 1.0) {
            const theta = Math.atan2(ny, nx);
            const nxn = nr * Math.cos(theta);
            const nyn = nr * Math.sin(theta);
            const x2 = Math.round(((nxn + 1) * width) / 2);
            const y2 = Math.round(((nyn + 1) * height) / 2);
            const srcpos = Math.round(y2 * width + x2);
            if (srcpos >= 0 && srcpos < width * height) {
              const dstIndex = Math.round(y * width + x);
              if (srcpos < srcpixels.length && dstIndex < dstpixels.length) {
                dstpixels[dstIndex] = srcpixels[srcpos];
              }
            }
          }
        }
      }
    }
    return dstpixels;
  }

  private async _processChangedProperties(options = { noFry: false }) {
    // console.debug("Enter _processChangedProperties");

    if (!this.loaded || this.working) {
      console.debug(
        "_processChangedProperties, bail-out: loaded=%s, working=%s",
        this.loaded,
        this.working
      );
      return;
    }
    const previousWorking = this.working;
    this.working = true;

    document.body.style.cursor = "wait";
    // console.debug("_processChangedProperties setting working to true");

    this.canvas = this.canvas || document.createElement("canvas");

    // What size to opeate upon...?
    this.width = this.canvas.width = this.img.width;
    this.height = this.canvas.height = this.img.height;

    this.ctx = this.canvas.getContext(
      "2d"
    )! as CanvasRenderingContext2DExtended;

    this.ctx.drawImage(this.img, 0, 0, this.width, this.height);

    if (options.noFry === false) {
      await this._fry();
    }

    this.working = previousWorking;
    // console.debug( "Leave _processChangedProperties, set working to %s", this.working );
  }

  private async _fry(currentDip = 1) {
    console.debug("Enter _fry");

    if (this.numberOfDips > 1) {
      throw new Error("_fry: only supporting one dip now");
    }

    const previousWorking = this.working;
    this.working = true;

    if (this.addEmojiBefore) {
      this._addEmoji();
    }

    await this._filterImage();

    // Mess up quality by repeatedly saving?
    for (
      this.jpegItteration = 1;
      this.jpegItteration <= this.totalJpegs;
      this.jpegItteration++
    ) {
      await this._lossySave();
    }

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

    document.body.style.cursor = "default";
    this.working = previousWorking;
    console.debug("Leave _fry, working set to %s, this.working");
  }

  private async _filterImage() {
    this.ctx.filter =
      "" +
      `saturate(${this.saturate}) ` +
      (this.useSharpness ? `url("#${this.convFilterId}") ` : "") +
      `brightness(${this.brightness})
        contrast(${this.contrast})
        hue-rotate(${this.hueRotate}deg) ` +
      (this.blurStdDeviation > 0 ? `url("#${this.blurFilterId}") ` : "");

    console.info("filter =", this.ctx.filter);
    console.info("globalCompositeOperation=", this.globalCompositeOperation);

    this.ctx.drawImage(this.img, 0, 0, this.width, this.height);

    if (this.noise > 0) {
      this.addNoise();
    }

    const canvas2: HTMLCanvasElement = document.createElement("canvas");
    canvas2.width = this.width;
    canvas2.height = this.height;
    const ctx2: CanvasRenderingContext2DExtended = canvas2.getContext(
      "2d"
    )! as CanvasRenderingContext2DExtended;
    ctx2.filter = `url("#${this.convFilterId}")  `;
    ctx2.drawImage(this.canvas, 0, 0, this.width, this.height);
    this.canvas = canvas2;
    console.debug("put filtered img to canvas");
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation
  private _overlay() {
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    const ctx: CanvasRenderingContext2DExtended = canvas.getContext(
      "2d"
    )! as CanvasRenderingContext2DExtended;
    canvas.width = this.width;
    canvas.height = this.height;
    ctx.save();

    ctx.drawImage(this.canvas, 0, 0, this.width, this.height);
    ctx.globalCompositeOperation = this.globalCompositeOperation;
    ctx.globalAlpha = this.globalCompositeAlpha;
    ctx.drawImage(this.originalImg, 0, 0, this.width, this.height);

    ctx.restore();
    this.canvas = canvas;
    this.ctx = ctx;
  }

  private async _losslessSave() {
    return await this._saveToImg("image/png", 1);
  }

  private _resize(width: number, height: number) {
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    const ctx: CanvasRenderingContext2DExtended = canvas.getContext(
      "2d"
    )! as CanvasRenderingContext2DExtended;
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(
      this.canvas,
      0,
      0,
      this.canvas.width,
      this.canvas.height,
      0,
      0,
      canvas.width,
      canvas.height
    );
    this.canvas = canvas;
    this.ctx = ctx;
    console.debug("made size ", this.canvas.width, this.canvas.height);
  }

  private async _lossySave() {
    // Make even worse:
    if (this.scale !== 1) {
      console.debug("scale", this.scale);
      const width = this.width * this.scale;
      const height = this.height * this.scale;
      if (width > 50 && height > 50) {
        this._resize(width, height);
        this._resize(this.width, this.height);
        console.debug("rescale in _lossySave");
      } else {
        console.debug("no rescale, ", width, height);
      }
    }
    const quality = Math.max(
      0,
      this.jpegQuality + Math.log(this.totalJpegs - this.jpegItteration) * 0.15
    );
    // console.debug("scale/quality %s / %s", this.scale, quality);
    await this._saveToImg("image/jpeg", quality);
  }

  private _saveToImg(
    mimeType: string = "image/jpeg",
    quality: number = this.jpegQuality
  ) {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob(
        async blob => {
          if (blob === null) {
            reject(new TypeError(`_lossySave expected a blob`));
          }
          await this._replaceImgWithJpegBlob(blob!);
          // console.debug("Done _saveToImg");
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
        /* // begin debug
        const el = document.createElement('img');
        (el as HTMLImageElement).src = url;
        document.body.appendChild(el);
        // end debug */
        // console.debug("loaded jpeg _replaceImgWithJpegBlob");
        URL.revokeObjectURL(url);
        this.ctx.drawImage(
          this.img,
          0,
          0,
          this.width,
          this.height,
          0,
          0,
          this.width,
          this.height
        );
        this.img.onerror = previousOnError;
        this.img.onload = previousOnLoad;
        // console.debug("Done replaceImgWithBlob");
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

  private randomNoise(width: number, height: number) {
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    const ctx: CanvasRenderingContext2DExtended = canvas.getContext(
      "2d"
    )! as CanvasRenderingContext2DExtended;
    canvas.width = width;
    canvas.height = height;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let i = 0;
    while (i < imageData.data.length) {
      imageData.data[i++] = imageData.data[i++] = imageData.data[i++] =
        Math.random() > 0.8 ? 255 : 0;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  private addNoise() {
    const noiseCanvas = this.randomNoise(this.width, this.height);
    this.ctx.save();
    this.ctx.globalAlpha = this.noise;

    // Roughly Perlin noise
    for (let size = 4; size <= noiseCanvas.width; size *= 2) {
      const x = Math.floor(Math.random() * noiseCanvas.width) - size;
      const y = Math.floor(Math.random() * noiseCanvas.height) - size;
      this.ctx.drawImage(
        noiseCanvas,
        x,
        y,
        size,
        size,
        0,
        0,
        this.width,
        this.height
      );
    }

    this.ctx.restore();
  }

  /** Saves at display size, not original size */
  private saveImage() {
    const url = URL.createObjectURL(this.lastBlob);
    const a = document.createElement("a");
    a.setAttribute("download", "true");
    a.setAttribute("href", url);
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  }

  private rotate45() {
    const parsed = (this.$.srcimg as HTMLElement).style.transform!.match(
      /rotate\((\d+)deg\)/
    );
    let deg = parsed ? parseInt(parsed[1], 10) + 90 : 90;
    if (deg > 270) {
      deg = 0;
    }

    const compStyles = window.getComputedStyle(this.$.srcimg as HTMLElement);
    const width = compStyles.getPropertyValue("width");
    const height = compStyles.getPropertyValue("height");
    (this.$.srcimg as HTMLElement).style.width = height;
    (this.$.srcimg as HTMLElement).style.height = width;
    (this.$.srcimg as HTMLElement).style.transform = `rotate(${deg}deg)`;
  }
}
