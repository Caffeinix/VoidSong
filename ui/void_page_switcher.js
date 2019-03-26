var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { css, customElement, html } from './custom_element.js';
let VoidPageSwitcher = class VoidPageSwitcher extends HTMLElement {
    connectedCallback() {
        this.addEventListener('activate', (event) => this.onPageActivated(event));
        const slot = this.getSlot();
        slot.addEventListener('slotchange', this.recalculateVisibilities.bind(this));
        this.index = Number.parseInt(this.getAttribute('index') || '0', 10) || 0;
        this.recalculateVisibilities();
    }
    set index(index) {
        this._index = index;
        this.recalculateVisibilities();
    }
    get index() {
        return this._index;
    }
    recalculateVisibilities() {
        const slot = this.getSlot();
        for (const [index, element] of Object.entries(slot.assignedElements())) {
            if (Number.parseInt(index, 10) !== this._index) {
                element.visible = false;
            }
            else {
                element.visible = true;
            }
        }
    }
    getSlot() {
        return this.shadowRoot.querySelector('slot');
    }
    onPageActivated(event) {
        for (const [index, element] of Object.entries(this.getSlot().assignedElements())) {
            if (element === event.target) {
                console.log('Activated', element, 'at', index);
                this.index = Number.parseInt(index, 10);
            }
        }
    }
};
VoidPageSwitcher = __decorate([
    customElement({
        selector: 'void-page-switcher',
        style: css `
  :host {
    display: block;
  }`,
        template: html `
    <slot></slot>
  `,
    })
], VoidPageSwitcher);
export { VoidPageSwitcher };
//# sourceMappingURL=void_page_switcher.js.map