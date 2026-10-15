import UIComponent from "./UIComponent.js";
import { getLotrData } from "./lotrApi.js";

export default class ChapterWidget extends UIComponent {
  constructor(config) {
    super({ ...config, title: "Хроники и главы" });
    this.currentController = null;
  }

  render() {
    const element = super.render();
    const intro = document.createElement("p");
    intro.className = "muted";
    intro.textContent = "Открой случайную главу из книжных хроник Средиземья.";
    const result = document.createElement("div");
    result.className = "api-result";
    const refresh = this.button("Перелистнуть хроники", "button button-primary");
    this.listen(refresh, "click", () => this.loadChapter(result, refresh));
    this.listen(window, "lotr-api-refresh", () => this.loadChapter(result, refresh));
    this.body.append(intro, result, refresh);
    this.loadChapter(result, refresh);
    return element;
  }

  async loadChapter(result, button) {
    this.currentController?.abort();
    const controller = this.createController();
    this.currentController = controller;
    button.disabled = true;
    result.replaceChildren(this.showMessage("Ищем главу в старых книгах…", "loading"));

    try {
      const chapters = await getLotrData("chapter?limit=100", controller.signal);
      if (controller.signal.aborted) return;
      if (!chapters.length) {
        result.replaceChildren(this.showMessage("Главы пока не найдены."));
        return;
      }

      const chapter = chapters[Math.floor(Math.random() * chapters.length)];
      const card = document.createElement("div");
      card.className = "character-card";
      const title = document.createElement("h4");
      title.textContent = chapter.chapterName || chapter.name || "Название главы неизвестно";
      card.append(title);

      const note = document.createElement("p");
      note.className = "muted";
      note.textContent = "Запись из каталога глав The One API";
      card.append(note);
      result.replaceChildren(card);
    } catch (error) {
      if (error.name !== "AbortError") {
        result.replaceChildren(this.showMessage(error.message || "Не удалось загрузить главу.", "error"));
      }
    } finally {
      if (!controller.signal.aborted) button.disabled = false;
    }
  }
}
