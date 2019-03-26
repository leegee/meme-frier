import { CanvasRenderingContext2DExtended } from "./CanvasRenderingContext2DExtended.interface";

export class Fisheye {

    bg = document.getElementById('bg');

    //src = "https://i.kinja-img.com/gawker-media/image/upload/t_original/fwf4rfhsob5wnkwlrwzl.jpg";
    src = "https://lumiere-a.akamaihd.net/v1/images/r_thorragnarok_header_nowplaying_47d36193.jpeg?region=0,0,2048,680";

    memeCanvas!: HTMLCanvasElement;
    fisheyeCanvas!: HTMLCanvasElement;
    fisheyeCtx!: CanvasRenderingContext2DExtended;
    size = 200;

    zoom = 1;

    constructor(_fisheyeCanvas, _memeCanvas, _size) {
        if (typeof _size !== 'undefined') {
            this.size = _size;
        }
        this.memeCanvas = _memeCanvas;
        this.fisheyeCanvas = _fisheyeCanvas;
        this.fisheyeCtx = _fisheyeCanvas.getContext('2d');

        this.fisheyeCanvas.width = this.memeCanvas.width;
        this.fisheyeCanvas.height = this.memeCanvas.height;
    }

    run(): void {
        window.addEventListener("mousemove", this.moved.bind(this));
        window.addEventListener("touchmove", this.moved.bind(this));
        window.addEventListener("click", this.click.bind(this));
        window.addEventListener("dblclick", this.dblclick.bind(this));
    }

    destructor(): void {
        window.removeEventListener("mousemove", this.moved.bind(this));
        window.removeEventListener("touchmove", this.moved.bind(this));
        window.removeEventListener("click", this.click.bind(this));
        window.removeEventListener("dblclick", this.dblclick.bind(this));
    }

    dblclick(e): void {
        e.preventDefault();
    }

    click(e): void {
        e.preventDefault();
    }

    moved(e) { // : MouseEvent | TouchEvent
        e.preventDefault();

        const cx = (e.touches ? e.touches[0].clientX : e.clientX);
        const cy = (e.touches ? e.touches[0].clientY : e.clientY);

        this.fisheyeCanvas.style.position = 'absolute';
        this.fisheyeCanvas.width = this.size;
        this.fisheyeCanvas.height = this.size;
        this.fisheyeCanvas.style.left = cx - this.size / 2 + 'px';
        this.fisheyeCanvas.style.top = cy - this.size / 2 + 'px';

        this.fisheyeCtx.fillStyle = '#000';
        this.fisheyeCtx.fillRect(0, 0, this.size, this.size);
        this.fisheyeCtx.drawImage(
            this.memeCanvas,
            cx - .5 * this.size / this.zoom,
            cy - .5 * this.size / this.zoom,
            // cx - this.memeCanvas.offsetLeft - .5 * this.size / zoom,
            // cy - this.memeCanvas.offsetTop - .5 * this.size / zoom,
            this.size / this.zoom,
            this.size / this.zoom,
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
