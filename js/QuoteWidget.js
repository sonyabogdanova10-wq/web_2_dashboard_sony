import UIComponent from "./UIComponent.js";
import { getLotrData } from "./lotrApi.js";

export default class QuoteWidget extends UIComponent {
  constructor(config) {
    super({ ...config, title: "Голоса Средиземья" });
    this.currentController = null;
  }

  render() {
    const element = super.render();
    const result = document.createElement("div");
    result.className = "api-result";
    const refresh = this.button("Открыть цитату", "button button-primary");
    this.listen(refresh, "click", () => this.loadQuote(result, refresh));
    this.listen(window, "lotr-api-refresh", () => this.loadQuote(result, refresh));
    this.body.append(result, refresh);
    this.loadQuote(result, refresh);
    return element;
  }

  async loadQuote(result, button) {
    this.currentController?.abort();
    const controller = this.createController();
    this.currentController = controller;
    button.disabled = true;
    result.replaceChildren(this.showMessage("Перелистываем древние свитки…", "loading"));
    try {
      const docs = await getLotrData("quote?limit=100", controller.signal);
      if (controller.signal.aborted) return;
      if (!docs.length) {
        result.replaceChildren(this.showMessage("Цитат пока не найдено."));
        return;
      }
      const quote = docs[Math.floor(Math.random() * docs.length)];
      const blockquote = document.createElement("blockquote");
      blockquote.textContent = `“${quote.dialog || "Слова не сохранились в свитке."}”`;
      const attribution = document.createElement("p");
      attribution.className = "quote-attribution";
      attribution.textContent = quote.character || "Неизвестный персонаж";
      result.replaceChildren(blockquote, attribution);
    } catch (error) {
      if (error.name !== "AbortError") {
        result.replaceChildren(this.showMessage(error.message || "Не удалось загрузить цитату.", "error"));
      }
    } finally {
      if (!controller.signal.aborted) button.disabled = false;
    }
  }
}
