var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { css, customElement, html } from './custom_element.js';
let VoidPage = class VoidPage extends HTMLElement {
    set title(title) {
        this.getHeader().textContent = title;
    }
    get title() {
        return this.getHeader().textContent || '';
    }
    set visible(visible) {
        this.getHeader().classList.toggle('hidden', !visible);
        this.getPage().classList.toggle('hidden', !visible);
    }
    get visible() {
        return !this.getPage().classList.contains('hidden');
    }
    connectedCallback() {
        this.getHeader().textContent = this.getAttribute('header');
        this.getHeader().addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('activate', {
                bubbles: true,
                composed: true,
            }));
        });
    }
    getHeader() {
        return this.shadowRoot.getElementById('header');
    }
    getPage() {
        return this.shadowRoot.getElementById('page');
    }
};
VoidPage = __decorate([
    customElement({
        selector: 'void-page',
        style: css `
  :host {
    display: block;
  }

  #header {
    display: flex;
    align-items: center;
    padding-left: 12px;
    height: 32px;
    font: 16px 'Saira Condensed', sans-serif;
    cursor: default;
    user-select: none;
    color: #000;
    background-color: #8AF;
    border: 1px solid #8AF;
    border-top-left-radius: 4px;
    border-bottom-right-radius: 4px;
    box-sizing: border-box;
    margin-bottom: 2px;
    margin-top: 2px;
    background-clip: padding-box;
  }

  #header.hidden {
    background-color: rgb(136, 170, 255, 0.8);
    border-color: rgb(136, 170, 255, 0.8);
  }

  #header:hover {
    background-color: #ACF;
    border-color: #ACF;
  }

  #header:active {
    background-color: #FFF;
    border-color: #FFF;
  }

  #page.hidden {
    display: none;
  }`,
        template: html `
    <div id="header"></div>
    <div id="page"><slot></slot></div>
  `,
    })
], VoidPage);
export { VoidPage };
//# sourceMappingURL=void_page.js.map