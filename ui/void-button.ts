import { css, customElement, html } from './custom_element.js';

@customElement({
  selector: 'void-button',
  style: css`
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
  template: html`
    <slot></slot>
  `,
  useShadow: true,
})
class VoidButton extends HTMLElement {
  public connectedCallback() {
  }
}
