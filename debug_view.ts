export class DebugView {
  public static getView(id: string): Element {
    let debugView = document.getElementById('debugView');
    if (!debugView) {
      debugView = document.createElement('section');
      debugView.id = 'debugView';
      document.getElementById('primaryColumn')!.appendChild(debugView);
    }
    let subview = debugView.querySelector(`.${id}`);
    if (!subview) {
      subview = document.createElement('section');
      subview.classList.add(id);
      const header = document.createElement('h1');
      header.textContent = id;
      debugView.appendChild(header);
      debugView.appendChild(subview);
    }
    return subview;
  }
}
