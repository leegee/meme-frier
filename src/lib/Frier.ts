import { FriedMeme } from './FriedMeme';

export class Frier {
    private static blurFilterId = 'blurFilterId';
    private static convFilterId = 'convFilterId';
    public static convFilterKernel = `
     0  -1   0
    -1   5  -1
     0  -1   0
    `;

    constructor(
        private document: Document,
        private imagesToDo: NodeListOf<HTMLImageElement>,
        private numberOfDips = 1,
        private totalJpegs = 28,
        private jpegQuality = 0.01, // 0 - 1
        private scale = 0.9,
        private blurStdDeviation = 0, // 0 - 1
        private brightness = 1, // 1 is default
        private saturate = 2, // 1 is default
        private contrast = 4, // 1 is default
        private hueRotate = 0, // 0 (deg) is default
        private useSharpness = true,
        private noise = 0.1, // 0-1
        private globalCompositeOperation = 'hard-light',
        private globalCompositeAlpha = 0.5,
        private addEmojiBefore = false,
        private addEmojiAfter = true,
        private useOverlay = false
    ) {
        if (this.document === null) {
            throw new TypeError('imageId:string is required.');
        }

        let filter;
        if (!(filter = this.document.getElementById(Frier.convFilterId)!)) {
            filter = this.document.createElement('svg');
            // http://srufaculty.sru.edu/david.dailey/svg/SVGOpen2010/Lab_solutions.htm
            filter.innerHTML = `
                <filter id="${Frier.convFilterId}">
                    <feConvolveMatrix order="3 3" preserveAlpha="true" kernelMatrix="${Frier.convFilterKernel}"/>
                </filter>
                <filter id="${Frier.blurFilterId}">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="${this.blurStdDeviation}" />
                </filter>
            `;
            this.document.body.appendChild(filter);
        }

        this.imagesToDo.forEach((image) => {
            new FriedMeme(
                this.document,
                image,
                parseInt(image.dataset.numberOfDips as string) || this.numberOfDips,
                parseInt(image.dataset.totalJpegs as string) || this.totalJpegs,
                parseInt(image.dataset.jpegQuality as string) || this.jpegQuality,
                parseFloat(image.dataset.scale as string) || this.scale,
                parseFloat(image.dataset.blurStdDeviation as string) || this.blurStdDeviation,
                parseInt(image.dataset.brightness as string) || this.brightness,
                parseInt(image.dataset.saturate as string) || this.saturate,
                parseInt(image.dataset.contrast as string) || this.contrast,
                parseInt(image.dataset.hueRotate as string) || this.hueRotate,
                image.dataset.hasOwnProperty('useSharpness') || this.useSharpness,
                parseInt(image.dataset.noise as string) || this.noise,
                image.dataset.globalCompositeOperation ? image.dataset.globalCompositeOperation : this.globalCompositeOperation,
                parseInt(image.dataset.globalCompositeAlpha as string) || this.globalCompositeAlpha,
                image.dataset.hasOwnProperty('addEmojiBefore') || this.addEmojiBefore,
                image.dataset.hasOwnProperty('addEmojiAfter') || this.addEmojiAfter,
                image.dataset.hasOwnProperty('useOverlay') || this.useOverlay,
                Frier.convFilterId,
                Frier.blurFilterId
        
            );
        });
    }
}

