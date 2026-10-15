export default class UIComponent {
  constructor({ title, id, minimized = false }) {
    if (new.target === UIComponent) {
      throw new Error("UIComponent — базовый класс. Создавай конкретный виджет.");
    }
    this.title = title;
    this.id = id;
    this.element = null;
    this._listeners = [];
    this._controllers = new Set();
    this._minimized = Boolean(minimized);
    this.onStateChange = () => {};
  }

  render() {
    const wrapper = document.createElement("article");
    wrapper.className = "widget";
    wrapper.id = this.id;

    const header = document.createElement("header");
    header.className = "widget-header";
    const heading = document.createElement("h3");
    heading.textContent = this.title;
    const actions = document.createElement("div");
    actions.className = "widget-actions";

    const minimizeButton = document.createElement("button");
    minimizeButton.className = "icon-button";
    minimizeButton.type = "button";
    minimizeButton.textContent = "−";
    minimizeButton.setAttribute("aria-label", "Свернуть виджет");
    const closeButton = document.createElement("button");
    closeButton.className = "icon-button close-button";
    closeButton.type = "button";
    closeButton.textContent = "×";
    closeButton.setAttribute("aria-label", "Удалить виджет");

    this.minimizeButton = minimizeButton;
    this.listen(minimizeButton, "click", () => this.setMinimized(!this._minimized));
    this.listen(closeButton, "click", () => {
      wrapper.dispatchEvent(new CustomEvent("widget-remove", { bubbles: true, detail: { id: this.id } }));
    });

    actions.append(minimizeButton, closeButton);
    header.append(heading, actions);
    const body = document.createElement("div");
    body.className = "widget-body";
    wrapper.append(header, body);
    this.element = wrapper;
    this.body = body;
    this.setMinimized(this._minimized, false);
    return wrapper;
  }

  setMinimized(value, notify = true) {
    this._minimized = Boolean(value);
    this.element?.classList.toggle("is-minimized", this._minimized);
    if (this.minimizeButton) {
      this.minimizeButton.textContent = this._minimized ? "+" : "−";
      this.minimizeButton.setAttribute("aria-label", this._minimized ? "Развернуть виджет" : "Свернуть виджет");
    }
    if (notify) this.onStateChange();
  }

  notifyChange() {
    this.onStateChange();
  }

  listen(target, eventName, handler) {
    target.addEventListener(eventName, handler);
    this._listeners.push({ target, eventName, handler });
  }

  createController() {
    const controller = new AbortController();
    this._controllers.add(controller);
    return controller;
  }

  destroy() {
    this._listeners.forEach(({ target, eventName, handler }) =>
      target.removeEventListener(eventName, handler)
    );
    this._listeners = [];
    this._controllers.forEach(controller => controller.abort());
    this._controllers.clear();
    this.element?.remove();
    this.element = null;
  }

  showMessage(message, kind = "") {
    const p = document.createElement("p");
    p.className = `widget-message ${kind}`.trim();
    p.textContent = message;
    return p;
  }

  button(label, className = "button") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    return button;
  }
}
