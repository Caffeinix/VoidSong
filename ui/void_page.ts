import { css, customElement, html } from './custom_element.js';

@customElement({
  selector: 'void-page',
  style: css`
  :host {
    display: block;
  }

  #header {
    display: flex;
    align-items: center;
    padding-left: 12px;
    height: 32px;
    font: 16px 'Saira Condensed';
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

  template: html`
    <div id="header"></div>
    <div id="page"><slot></slot></div>
  `,
})
export class VoidPage extends HTMLElement {
  public set title(title: string) {
    this.getHeader().textContent = title;
  }

  public get title(): string {
    return this.getHeader().textContent || '';
  }

  public set visible(visible: boolean) {
    this.getHeader().classList.toggle('hidden', !visible);
    this.getPage().classList.toggle('hidden', !visible);
  }

  public get visible(): boolean {
    return !this.getPage().classList.contains('hidden');
  }

  public connectedCallback() {
    this.getHeader().textContent = this.getAttribute('header');
    this.getHeader().addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('activate', {
        bubbles: true,
        composed: true,
      }));
    });
  }

  private getHeader(): HTMLElement {
    return this.shadowRoot!.getElementById('header')!;
  }
  private getPage(): HTMLElement {
    return this.shadowRoot!.getElementById('page')!;
  }
}
