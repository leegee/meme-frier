import { CanvasRenderingContext2DExtended } from "./CanvasRenderingContext2DExtended.interface";

export class Fisheye {

    bg = document.getElementById('bg');

    //src = "https://i.kinja-img.com/gawker-media/image/upload/t_original/fwf4rfhsob5wnkwlrwzl.jpg";
    src = "https://lumiere-a.akamaihd.net/v1/images/r_thorragnarok_header_nowplaying_47d36193.jpeg?region=0,0,2048,680";

    memeCanvas!: HTMLCanvasElement;
    fisheyeCanvas!: HTMLCanvasElement;
    fisheyeCtx!: CanvasRenderingContext2DExtended;
    listeners: { [key: string]: EventListenerOrEventListenerObject; } = {};
    size: number;
    boundingRect!: {
        left: number,
        top: number,
        right: number,
        bottom: number
    };
    tx!: number;
    ty!: number;
    cx!: number;
    cy!: number;

    constructor(
        _fisheyeCanvas: HTMLCanvasElement,
        _memeCanvas: HTMLCanvasElement,
        _boundingRect: {
            left: number,
            top: number,
            right: number,
            bottom: number
        },
        _size: number | undefined | null = null
    ) {
        this.memeCanvas = _memeCanvas;
        this.boundingRect = _boundingRect;
        this.fisheyeCanvas = _fisheyeCanvas;
        this.fisheyeCtx = _fisheyeCanvas.getContext('2d') as CanvasRenderingContext2DExtended;
        this.fisheyeCanvas.style.display = 'block';
        this.size = _size || Math.floor((this.memeCanvas.width > this.memeCanvas.height ? this.memeCanvas.width : this.memeCanvas.height) / 3);
    }

    run(): void {
        this.listeners.mousemouse = this.moved.bind(this);
        this.listeners.touchmove = this.moved.bind(this);
        this.listeners.click = this.click.bind(this);
        window.addEventListener("mousemove", this.listeners.mousemouse);
        window.addEventListener("touchmove", this.listeners.touchmove);
        window.addEventListener("click", this.listeners.click);
        this.fisheyeCanvas.style.position = 'fixed';
        this.fisheyeCanvas.style.zIndex = '10';
        this.fisheyeCanvas.width = this.size;
        this.fisheyeCanvas.height = this.size;
    }

    finalise(): void {
        window.removeEventListener("mousemove", this.listeners.mousemouse);
        window.removeEventListener("touchmove", this.listeners.touchmove);
        window.removeEventListener("click", this.listeners.click);
        const ctx = this.memeCanvas.getContext('2d');
        ctx!.drawImage(this.fisheyeCanvas, this.tx, this.ty);
        this.fisheyeCanvas.style.display = 'none';
    }


    click(e): void {
        e.preventDefault();
    }


    moved(e): void {
        e.preventDefault();

        this.cx = (e.touches ? e.touches[0].offsetX : e.offsetX);
        this.cy = (e.touches ? e.touches[0].offsetY : e.offsetY);

        this.tx = this.cx - this.boundingRect.left - (.5 * this.size);
        this.ty = this.cy - this.boundingRect.top - (.5 * this.size);

        this.fisheyeCanvas.style.left = this.cx - (.5 * this.size) + 'px';
        this.fisheyeCanvas.style.top = this.cy - (.5 * this.size) + 'px';

        this.fisheyeCtx.fillStyle = '#000';
        this.fisheyeCtx.fillRect(0, 0, this.size, this.size);
        this.fisheyeCtx.drawImage(
            this.memeCanvas,
            this.tx,
            this.ty,
            this.size,
            this.size,
            0,
            0,
            this.size,
            this.size
        );

        const imgData = this.fisheyeCtx.getImageData(0, 0, this.size, this.size);
        const pixels = imgData.data;
        const h = this.size;
        const w = this.size;
        let pixelsCopy: any = []; // Uint8ClampedArray
        let index = 0;

        for (let i = 0; i <= pixels.length; i += 4) {
            pixelsCopy[index] = [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]];
            index++;
        }

        const result = this.processImage(pixelsCopy, w, h);

        for (var i = 0; i < result.length; i++) {
            index = 4 * i;
            if (result[i] !== undefined) {
                pixels[index + 0] = result[i][0];
                pixels[index + 1] = result[i][1];
                pixels[index + 2] = result[i][2];
                pixels[index + 3] = result[i][3];
            }
        }

        this.fisheyeCtx.putImageData(imgData, 0, 0);
    }

    processImage(srcpixels: number[], w: number, h: number) {
        let dstpixels = srcpixels.slice();

        for (let y = 0; y < h; y++) {
            const ny = ((2 * y) / h) - 1;
            const ny2 = ny * ny;

            for (let x = 0; x < w; x++) {
                const nx = ((2 * x) / w) - 1;
                const nx2 = nx * nx;
                const r = Math.sqrt(nx2 + ny2);

                if (0.0 <= r && r <= 1.0) {
                    let nr = Math.sqrt(1.0 - r * r);
                    nr = (r + (1.0 - nr)) / 2.0;

                    if (nr <= 1.0) {
                        const theta = Math.atan2(ny, nx);
                        const nxn = nr * Math.cos(theta);
                        const nyn = nr * Math.sin(theta);
                        const x2 = Math.floor(((nxn + 1) * w) / 2);
                        const y2 = Math.floor(((nyn + 1) * h) / 2);
                        const srcpos = Math.floor(y2 * w + x2);
                        if (srcpos >= 0 && srcpos < w * h) {
                            dstpixels[Math.floor(y * w + x)] = srcpixels[srcpos];
                        }
                    }
                }
            }
        }

        return dstpixels;
    }
}
