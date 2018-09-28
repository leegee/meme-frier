import { html } from '@polymer/polymer/polymer-element';

export const getTemplate = (view) => {
    const stringArray = [`${view}`];
    return html({ raw: stringArray, ...stringArray } as TemplateStringsArray);
}
