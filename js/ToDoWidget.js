import UIComponent from "./UIComponent.js";

export default class ToDoWidget extends UIComponent {
  constructor(config) {
    super({ ...config, title: "Заметки путешественника" });
    this.tasks = Array.isArray(config.tasks) ? config.tasks.map(task => ({
      id: String(task.id ?? Date.now() + Math.random()),
      text: String(task.text ?? ""),
      done: Boolean(task.done)
    })).filter(task => task.text.trim()) : [];
  }

  render() {
    const element = super.render();
    const form = document.createElement("form");
    form.className = "todo-form";
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Добавить запись в журнал…";
    input.setAttribute("aria-label", "Текст новой заметки");
    input.maxLength = 120;
    const add = this.button("Добавить", "button button-primary");
    add.type = "submit";
    form.append(input, add);
    const list = document.createElement("ul");
    list.className = "todo-list";

    this.listen(form, "submit", event => {
      event.preventDefault();
      const text = input.value.trim();
      if (!text) {
        input.focus();
        return;
      }
      this.tasks.push({ id: globalThis.crypto?.randomUUID?.() || String(Date.now() + Math.random()), text, done: false });
      input.value = "";
      this.drawTasks(list);
      this.notifyChange();
      input.focus();
    });

    this.listen(list, "change", event => {
      const checkbox = event.target.closest('input[type="checkbox"][data-task-id]');
      if (!checkbox) return;
      const task = this.tasks.find(item => item.id === checkbox.dataset.taskId);
      if (!task) return;
      task.done = checkbox.checked;
      this.drawTasks(list);
      this.notifyChange();
    });
    this.listen(list, "click", event => {
      const remove = event.target.closest("button[data-remove-task]");
      if (!remove) return;
      this.tasks = this.tasks.filter(item => item.id !== remove.dataset.removeTask);
      this.drawTasks(list);
      this.notifyChange();
    });

    this.body.append(form, list);
    this.drawTasks(list);
    return element;
  }

  drawTasks(list) {
    list.replaceChildren();
    if (!this.tasks.length) {
      const empty = document.createElement("li");
      empty.className = "empty-note";
      empty.textContent = "Журнал пока пуст. Запиши первое наблюдение.";
      list.append(empty);
      return;
    }
    this.tasks.forEach(task => {
      const item = document.createElement("li");
      item.className = task.done ? "todo-item is-done" : "todo-item";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.done;
      checkbox.dataset.taskId = task.id;
      checkbox.setAttribute("aria-label", `Отметить «${task.text}» выполненной`);
      const text = document.createElement("span");
      text.textContent = task.text;
      const remove = this.button("×", "icon-button remove-task");
      remove.dataset.removeTask = task.id;
      remove.setAttribute("aria-label", `Удалить заметку «${task.text}»`);
      item.append(checkbox, text, remove);
      list.append(item);
    });
  }
}
