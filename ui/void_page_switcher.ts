import { css, customElement, html } from './custom_element.js';
import { VoidPage } from './void_page.js';

@customElement({
  selector: 'void-page-switcher',
  style: css`
  :host {
    display: block;
  }`,
  template: html`
    <slot></slot>
  `,
})
export class VoidPageSwitcher extends HTMLElement {
  private _index: number;
  public connectedCallback() {
    this.addEventListener('activate', (event) => this.onPageActivated(event));
    const slot = this.getSlot();
    slot.addEventListener('slotchange', this.recalculateVisibilities.bind(this));
    this.index = Number.parseInt(this.getAttribute('index') || '0', 10) || 0;
    this.recalculateVisibilities();
  }

  public set index(index: number) {
    this._index = index;
    this.recalculateVisibilities();
  }

  public get index(): number {
    return this._index;
  }

  private recalculateVisibilities() {
    const slot = this.getSlot();
    for (const [index, element] of Object.entries(slot.assignedElements())) {
      if (Number.parseInt(index, 10) !== this._index) {
        (element as VoidPage).visible = false;
      } else {
        (element as VoidPage).visible = true;
      }
    }
  }

  private getSlot(): HTMLSlotElement {
    return this.shadowRoot!.querySelector('slot') as HTMLSlotElement;
  }

  private onPageActivated(event: Event): void {
    for (const [index, element] of Object.entries(this.getSlot().assignedElements())) {
      if (element === event.target) {
        console.log('Activated', element, 'at', index);
        this.index = Number.parseInt(index, 10);
      }
    }
  }
}
