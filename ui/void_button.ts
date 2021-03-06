import { css, customElement, html } from './custom_element.js';

@customElement({
  selector: 'void-button',
  style: css`
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
  template: html`
    <slot></slot>
  `,
})
class VoidButton extends HTMLElement {
  public connectedCallback() {
    this.tabIndex = 0;
    this.addEventListener('click', this.activate.bind(this));
    this.addEventListener('keydown', this.handleKey.bind(this));
  }

  private handleKey(event: KeyboardEvent) {
    if (event.key === ' ') {
      this.activate();
      event.stopPropagation();
    }
  }

  private activate() {
    this.dispatchEvent(new CustomEvent('activate', {
      bubbles: true,
      composed: true,
    }));
  }
}
