var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { css, customElement, html } from './custom_element.js';
let VoidButton = class VoidButton extends HTMLElement {
    connectedCallback() {
    }
};
VoidButton = __decorate([
    customElement({
        selector: 'void-button',
        style: css `
  :host {
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-end;
    background: #101012;
    border: 1px solid #8AF;
    padding: 0 4px;
    border-top-left-radius: 6px;
    border-bottom-right-radius: 6px;
    min-height: 32px;
    min-width: 96px;
    box-sizing: border-box;
    cursor: default;
  }

  slot {
    color: #8AF;
    font: 13px 'Saira Condensed', sans-serif;
    font-weight: 400;
  }`,
        template: html `
    <slot></slot>
  `,
        useShadow: true,
    })
], VoidButton);
//# sourceMappingURL=void-button.js.map