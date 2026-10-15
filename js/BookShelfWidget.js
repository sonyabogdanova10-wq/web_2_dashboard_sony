import UIComponent from "./UIComponent.js";
import { getLotrData } from "./lotrApi.js";

export default class BookShelfWidget extends UIComponent {
  constructor(config) {
    super({ ...config, title: "Книжная полка" });
    this.currentController = null;
  }

  render() {
    const element = super.render();
    const intro = document.createElement("p");
    intro.className = "muted";
    intro.textContent = "Три книги, с которых начинается история Средиземья.";
    const result = document.createElement("div");
    result.className = "api-result";
    const refresh = this.button("Обновить полку", "button button-primary");
    this.listen(refresh, "click", () => this.loadBooks(result, refresh));
    this.listen(window, "lotr-api-refresh", () => this.loadBooks(result, refresh));
    this.body.append(intro, refresh, result);
    this.loadBooks(result, refresh);
    return element;
  }

  async loadBooks(result, button) {
    this.currentController?.abort();
    const controller = this.createController();
    this.currentController = controller;
    button.disabled = true;
    result.replaceChildren(this.showMessage("Ищем книги в архиве…", "loading"));

    try {
      const books = await getLotrData("book", controller.signal);
      if (controller.signal.aborted) return;

      if (!books.length) {
        result.replaceChildren(this.showMessage("В архиве пока нет книг."));
        return;
      }

      const list = document.createElement("div");
      list.className = "book-list";

      books.forEach((book, index) => {
        const card = document.createElement("article");
        card.className = "book-card";

        const number = document.createElement("span");
        number.className = "book-number";
        number.textContent = String(index + 1).padStart(2, "0");

        const details = document.createElement("div");
        details.className = "book-details";

        const title = document.createElement("h4");
        title.textContent = book.name || "Название неизвестно";
        const note = document.createElement("p");
        note.textContent = "Книга из библиотеки The One API";

        details.append(title, note);
        card.append(number, details);
        list.append(card);
      });

      result.replaceChildren(list);
    } catch (error) {
      if (error.name !== "AbortError") {
        result.replaceChildren(this.showMessage(error.message || "Не удалось загрузить книги.", "error"));
      }
    } finally {
      if (!controller.signal.aborted) button.disabled = false;
    }
  }
}
