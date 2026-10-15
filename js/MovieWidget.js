import UIComponent from "./UIComponent.js";
import { getLotrData } from "./lotrApi.js";

export default class MovieWidget extends UIComponent {
  constructor(config) {
    super({ ...config, title: "Кинохроника" });
    this.currentController = null;
  }

  render() {
    const element = super.render();
    const intro = document.createElement("p");
    intro.className = "muted";
    intro.textContent = "Случайная запись о фильме из легендарной кинотрилогии и не только.";
    const result = document.createElement("div");
    result.className = "api-result";
    const refresh = this.button("Открыть запись", "button button-primary");
    this.listen(refresh, "click", () => this.loadMovie(result, refresh));
    this.listen(window, "lotr-api-refresh", () => this.loadMovie(result, refresh));
    this.body.append(intro, result, refresh);
    this.loadMovie(result, refresh);
    return element;
  }

  async loadMovie(result, button) {
    this.currentController?.abort();
    const controller = this.createController();
    this.currentController = controller;
    button.disabled = true;
    result.replaceChildren(this.showMessage("Ищем кинолетопись…", "loading"));

    try {
      const movies = await getLotrData("movie?limit=100", controller.signal);
      if (controller.signal.aborted) return;
      if (!movies.length) {
        result.replaceChildren(this.showMessage("Записей о фильмах пока нет."));
        return;
      }

      const movie = movies[Math.floor(Math.random() * movies.length)];
      const card = document.createElement("div");
      card.className = "character-card";
      const title = document.createElement("h4");
      title.textContent = movie.name || "Название неизвестно";
      card.append(title);

      const details = [
        ["Длительность", movie.runtimeInMinutes ? `${movie.runtimeInMinutes} мин.` : ""],
        ["Бюджет", movie.budgetInMillions ? `${movie.budgetInMillions} млн.` : ""],
        ["Награды «Оскар»", movie.academyAwardWins],
        ["Оценка Rotten Tomatoes", movie.rottenTomatoesScore ? `${movie.rottenTomatoesScore}%` : ""]
      ];

      details.forEach(([label, value]) => {
        if (value !== undefined && value !== null && value !== "" && value !== "NaN") {
          const line = document.createElement("p");
          const strong = document.createElement("strong");
          strong.textContent = `${label}: `;
          line.append(strong, document.createTextNode(String(value)));
          card.append(line);
        }
      });

      result.replaceChildren(card);
    } catch (error) {
      if (error.name !== "AbortError") {
        result.replaceChildren(this.showMessage(error.message || "Не удалось загрузить фильм.", "error"));
      }
    } finally {
      if (!controller.signal.aborted) button.disabled = false;
    }
  }
}
