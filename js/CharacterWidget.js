import UIComponent from "./UIComponent.js";
import { getLotrData } from "./lotrApi.js";

export default class CharacterWidget extends UIComponent {
  constructor(config) {
    super({ ...config, title: "Герой Средиземья" });
    this.currentController = null;
  }

  render() {
    const element = super.render();
    const intro = document.createElement("p");
    intro.className = "muted";
    intro.textContent = "Открой досье на случайного персонажа.";
    const result = document.createElement("div");
    result.className = "api-result";
    const refresh = this.button("Найти героя", "button button-primary");
    this.listen(refresh, "click", () => this.loadCharacter(result, refresh));
    this.listen(window, "lotr-api-refresh", () => this.loadCharacter(result, refresh));
    this.body.append(intro, refresh, result);
    this.loadCharacter(result, refresh);
    return element;
  }

  async loadCharacter(result, button) {
    this.currentController?.abort();
    const controller = this.createController();
    this.currentController = controller;
    button.disabled = true;
    result.replaceChildren(this.showMessage("Ищем сведения в архивах…", "loading"));
    try {
      const docs = await getLotrData("character?limit=100", controller.signal);
      if (controller.signal.aborted) return;
      if (!docs.length) {
        result.replaceChildren(this.showMessage("В архиве пока нет записей."));
        return;
      }
      const person = docs[Math.floor(Math.random() * docs.length)];
      const card = document.createElement("div");
      card.className = "character-card";
      const name = document.createElement("h4");
      name.textContent = person.name || "Имя неизвестно";
      card.append(name);
      const details = [
        ["Раса", person.race],
        ["Пол", person.gender],
        ["Рождение", person.birth],
        ["Смерть", person.death],
        ["Род", person.realm]
      ];
      details.forEach(([label, value]) => {
        if (value && value !== "NaN") {
          const line = document.createElement("p");
          const strong = document.createElement("strong");
          strong.textContent = `${label}: `;
          line.append(strong, document.createTextNode(value));
          card.append(line);
        }
      });
      result.replaceChildren(card);
    } catch (error) {
      if (error.name !== "AbortError") {
        result.replaceChildren(this.showMessage(error.message || "Не удалось загрузить данные.", "error"));
      }
    } finally {
      if (!controller.signal.aborted) button.disabled = false;
    }
  }
}
