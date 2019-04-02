import { CanvasRenderingContext2DExtended } from "./CanvasRenderingContext2DExtended.interface";

export class Fisheye {

    bg = document.getElementById('bg');

    //src = "https://i.kinja-img.com/gawker-media/image/upload/t_original/fwf4rfhsob5wnkwlrwzl.jpg";
    src = "https://lumiere-a.akamaihd.net/v1/images/r_thorragnarok_header_nowplaying_47d36193.jpeg?region=0,0,2048,680";

    memeCanvas!: HTMLCanvasElement;
    fisheyeCanvas!: HTMLCanvasElement;
    fisheyeCtx!: CanvasRenderingContext2DExtended;
    listeners: { [key: string]: EventListenerOrEventListenerObject; } = {};
    sizeX = 200;
    sizeY = 200;

    constructor(_fisheyeCanvas, _memeCanvas, _sizeX, _sizeY = null) {
        if (typeof _sizeX !== 'undefined') {
            this.sizeX = _sizeX;
        }
        if (typeof _sizeY !== 'undefined') {
            this.sizeY = this.sizeX;
        }
        this.memeCanvas = _memeCanvas;
        this.fisheyeCanvas = _fisheyeCanvas;
        this.fisheyeCtx = _fisheyeCanvas.getContext('2d');

        this.fisheyeCanvas.style.display = 'block';
        this.fisheyeCanvas.width = this.memeCanvas.width;
        this.fisheyeCanvas.height = this.memeCanvas.height;
    }

    run(): void {
        this.listeners.mousemouse = this.moved.bind(this); 
        this.listeners.touchmove = this.moved.bind(this);
        this.listeners.click = this.click.bind(this);
        window.addEventListener("mousemove", this.listeners.mousemouse);
        window.addEventListener("touchmove", this.listeners.touchmove);
        window.addEventListener("click", this.listeners.click);
    }

    destructor(): void {
        window.removeEventListener("mousemove", this.listeners.mousemouse);
        window.removeEventListener("touchmove", this.listeners.touchmove);
        window.removeEventListener("click", this.listeners.click);
        const ctx = this.memeCanvas.getContext('2d');
        ctx!.drawImage( 
            this.fisheyeCanvas, 
            parseInt(this.fisheyeCanvas.style.left || ''),
            parseInt(this.fisheyeCanvas.style.top || '')
        );
        this.fisheyeCanvas.style.display = 'none';
    }


    click(e): void {
        e.preventDefault();
    }

    moved(e): void { // : MouseEvent | TouchEvent
        e.preventDefault();

        const cx = (e.touches ? e.touches[0].clientX : e.clientX);
        const cy = (e.touches ? e.touches[0].clientY : e.clientY);

        this.fisheyeCanvas.style.position = 'absolute';
        this.fisheyeCanvas.width = this.sizeX;
        this.fisheyeCanvas.height = this.sizeY;
        this.fisheyeCanvas.style.left = cx - this.sizeX / 2 + 'px';
        this.fisheyeCanvas.style.top = cy - this.sizeY / 2 + 'px';

        this.fisheyeCtx.fillStyle = '#000';
        this.fisheyeCtx.fillRect(0, 0, this.sizeX, this.sizeY);
        this.fisheyeCtx.drawImage(
            this.memeCanvas,
            cx - this.memeCanvas.offsetLeft - .5 * this.sizeX,
            cy - this.memeCanvas.offsetTop - .5 * this.sizeY,
            this.sizeX,
            this.sizeY,
            0,
            0,
            this.sizeX,
            this.sizeY
        );

        const imgData = this.fisheyeCtx.getImageData(0, 0, this.sizeX, this.sizeY);
        const pixels = imgData.data;
        const h = this.sizeX;
        const w = this.sizeY;
        let pixelsCopy: any = []; // Uint8ClampedArray
        let index = 0;

        for (let i = 0; i <= pixels.length; i += 4) {
            pixelsCopy[index] = [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]];
            index++;
        }

        const result = this.processImage(pixelsCopy, w, h);

        for (var i = 0; i < result.length; i++) {
            index = 4 * i;
            if (result[i] != undefined) {
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
