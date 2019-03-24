interface CustomElementConfig {
  selector: string;
  template: string;
  style?: string;
  useShadow?: boolean;
}

export function html(raw) {
  return raw;
}

export function css(raw) {
  return raw;
}

export function customElement(config: CustomElementConfig): ClassDecorator {
  return (cls) => {
    if (config.selector.indexOf('-') <= 0) {
      throw new Error('Custom element names must contain at least one dash');
  }
    if (!config.template) {
      throw new Error('You need to pass a template for the element');
    }
    const template = document.createElement('template');
    if (config.style) {
      config.template = `<style>${config.style}</style> ${config.template}`;
    }
    template.innerHTML = config.template;
    const nullFunction = () => {};
    const connectedCallback = cls.prototype.connectedCallback || nullFunction;
    cls.prototype.connectedCallback = function() {
      const clone = document.importNode(template.content, true);
      if (config.useShadow) {
        this.attachShadow({ mode: 'open' }).appendChild(clone);
      } else {
        this.appendChild(clone);
      }
      connectedCallback.call(this);
    };
    window.customElements.define(config.selector, cls);
  };
}
