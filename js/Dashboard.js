const STORAGE_KEY = "arda-dashboard-state-v1";

export default class Dashboard {
  constructor(container, countElement) {
    this.container = container;
    this.countElement = countElement;
    this.widgets = [];
    this.widgetClasses = new Map();
    this.nextId = 1;
    this.container.addEventListener("widget-remove", event => this.removeWidget(event.detail.id));
  }

  register(widgetType, WidgetClass) {
    this.widgetClasses.set(widgetType, WidgetClass);
  }

  addWidget(widgetType, savedState = {}, persist = true) {
    const WidgetClass = this.widgetClasses.get(widgetType);
    if (!WidgetClass) {
      console.error(`Неизвестный тип виджета: ${widgetType}`);
      return;
    }
    const widget = new WidgetClass({
      id: `widget-${this.nextId++}`,
      tasks: Array.isArray(savedState.tasks) ? savedState.tasks : [],
      minimized: Boolean(savedState.minimized)
    });
    widget.widgetType = widgetType;
    widget.onStateChange = () => this.saveState();
    this.widgets.push(widget);
    this.container.append(widget.render());
    widget.setMinimized(Boolean(savedState.minimized), false);
    this.updateCount();
    if (persist) this.saveState();
    return widget;
  }

  removeWidget(widgetId) {
    const index = this.widgets.findIndex(widget => widget.id === widgetId);
    if (index === -1) return;
    this.widgets[index].destroy();
    this.widgets.splice(index, 1);
    this.updateCount();
    this.saveState();
  }

  updateCount() {
    this.countElement.textContent = String(this.widgets.length);
  }

  saveState() {
    const state = this.widgets.map(widget => ({
      type: widget.widgetType,
      minimized: Boolean(widget._minimized),
      ...(widget.widgetType === "todo" ? { tasks: widget.tasks } : {})
    }));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      // Хранилище может быть отключено или заполнено, но панель управления должна работать при этом
      console.warn("Не удалось сохранить состояние панели.", error);
    }
  }

  restoreOrInitialize(defaultTypes) {
    let saved = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.every(item => item && typeof item.type === "string")) {
          saved = parsed;
        }
      }
    } catch (error) {
      console.warn("Сохранённое состояние панели повреждено. Создаём начальную панель.", error);
    }

    const entries = saved ?? defaultTypes.map(type => ({ type }));
    entries.forEach(entry => {
      if (this.widgetClasses.has(entry.type)) this.addWidget(entry.type, entry, false);
    });
    if (this.widgets.length === 0) {
      defaultTypes.forEach(type => this.addWidget(type, {}, false));
    }
    this.updateCount();
    this.saveState();
  }
}
