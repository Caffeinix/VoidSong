var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { css, customElement, html } from './custom_element.js';
let VoidButton = class VoidButton extends HTMLElement {
    connectedCallback() {
        this.tabIndex = 0;
        this.addEventListener('click', this.activate.bind(this));
        this.addEventListener('keydown', this.handleKey.bind(this));
    }
    handleKey(event) {
        if (event.key === ' ') {
            this.activate();
            event.stopPropagation();
        }
    }
    activate() {
        this.dispatchEvent(new CustomEvent('activate', {
            bubbles: true,
            composed: true,
        }));
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
    color: #000;
    background: #8AF;
    border: 1px solid #8AF;
    padding: 1px 5px;
    border-top-left-radius: 6px;
    border-bottom-right-radius: 6px;
    min-height: 32px;
    min-width: 96px;
    box-sizing: border-box;
    cursor: default;
    user-select: none;
    transition: color 0.05s ease, background-color 0.05s ease, border-color 0.05s ease;
  }

  :host(:focus) {
    outline: none;
    border-color: #FFF;
  }

  :host(:hover) {
    background-color: #ACF;
    border-color: #ACF;
  }

  :host(:active) {
    background-color: #FFF;
    border-color: #FFF;
  }

  slot {
    font: 12px 'Saira Condensed', sans-serif;
    font-weight: 500;
  }`,
        template: html `
    <slot></slot>
  `,
    })
], VoidButton);
//# sourceMappingURL=void_button.js.map