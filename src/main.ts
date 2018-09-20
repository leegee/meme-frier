import { Frier } from './lib/Frier';

document.addEventListener("DOMContentLoaded", () => {

    new Frier(document, document.querySelectorAll(".fry-this"));

});