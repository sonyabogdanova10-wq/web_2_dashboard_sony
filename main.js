import Dashboard from "./js/Dashboard.js";
import CharacterWidget from "./js/CharacterWidget.js";
import QuoteWidget from "./js/QuoteWidget.js";
import ToDoWidget from "./js/ToDoWidget.js";
import BookShelfWidget from "./js/BookShelfWidget.js";
import MovieWidget from "./js/MovieWidget.js";
import ChapterWidget from "./js/ChapterWidget.js";

const dashboard = new Dashboard(document.querySelector("#dashboard"), document.querySelector("#widget-count"));
dashboard.register("character", CharacterWidget);
dashboard.register("quote", QuoteWidget);
dashboard.register("todo", ToDoWidget);
dashboard.register("books", BookShelfWidget);
dashboard.register("movies", MovieWidget);
dashboard.register("chapters", ChapterWidget);

// ВОССТАНОВЛЕНИЕ СЕТКИ ВИДЖЕТОВ
dashboard.restoreOrInitialize(["character", "quote", "todo", "books", "movies", "chapters"]);

document.querySelector("#add-character").addEventListener("click", () => dashboard.addWidget("character"));
document.querySelector("#add-quote").addEventListener("click", () => dashboard.addWidget("quote"));
document.querySelector("#add-todo").addEventListener("click", () => dashboard.addWidget("todo"));
document.querySelector("#add-books").addEventListener("click", () => dashboard.addWidget("books"));
document.querySelector("#add-movies").addEventListener("click", () => dashboard.addWidget("movies"));
document.querySelector("#add-chapters").addEventListener("click", () => dashboard.addWidget("chapters"));

const tokenInput = document.querySelector("#api-token");
const tokenStatus = document.querySelector("#token-status");
document.querySelector("#save-token").addEventListener("click", () => {
  const token = tokenInput.value.trim();
  if (!token) {
    tokenStatus.textContent = "Вставь токен из личного кабинета The One API.";
    tokenStatus.className = "small status-error";
    return;
  }
  // ТОКЕН ДЕЙСТВУЕТ ДО ПЕРЕЗАГРУЗКИ СТРАНИЦЫ
  window.dispatchEvent(new CustomEvent("lotr-token-change", { detail: { token } }));
  tokenInput.value = "";
  tokenStatus.textContent = "Токен применён. Он действует только до обновления страницы.";
  tokenStatus.className = "small status-success";
});

// Potter DB API: без ключа
async function loadPotterCharacter() {
  const result = document.querySelector("#potter-result");
  const button = document.querySelector("#potter-refresh");
  const controller = new AbortController();
  button.disabled = true;
  result.replaceChildren(message("Загружаем сведения из магического архива…", "loading"));
  try {
    const response = await fetch("https://api.potterdb.com/v1/characters?page%5Bsize%5D=50", { signal: controller.signal });
    if (!response.ok) throw new Error(`Сервис ответил ошибкой (${response.status}).`);
    const payload = await response.json();
    const characters = Array.isArray(payload.data) ? payload.data : [];
    if (!characters.length) {
      result.replaceChildren(message("В этом ответе нет записей. Попробуй ещё раз."));
      return;
    }
    const character = characters[Math.floor(Math.random() * characters.length)];
    const attributes = character.attributes || {};
    const card = document.createElement("div");
    card.className = "character-card";
    const title = document.createElement("h4");
    title.textContent = attributes.name || attributes.slug || "Имя не указано";
    card.append(title);
    const details = [
      ["Дом", attributes.house],
      ["Вид", attributes.species],
      ["Патронус", attributes.patronus],
      ["Родословная", attributes.ancestry]
    ];
    details.forEach(([label, value]) => {
      if (value) {
        const line = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = `${label}: `;
        line.append(strong, document.createTextNode(String(value)));
        card.append(line);
      }
    });
    result.replaceChildren(card);
  } catch (error) {
    result.replaceChildren(message(error.message || "Не удалось связаться с Potter DB.", "error"));
  } finally {
    button.disabled = false;
  }
}

// Open Library API: без ключа
async function loadOpenLibraryBook() {
  const result = document.querySelector("#openlibrary-result");
  const button = document.querySelector("#openlibrary-refresh");
  button.disabled = true;
  result.replaceChildren(message("Ищем книги в открытом каталоге…", "loading"));
  try {
    const response = await fetch("https://openlibrary.org/search.json?q=fantasy%20fiction&limit=30");
    if (!response.ok) throw new Error(`Сервис ответил ошибкой (${response.status}).`);
    const payload = await response.json();
    const books = Array.isArray(payload.docs) ? payload.docs : [];
    if (!books.length) {
      result.replaceChildren(message("Книги не найдены. Попробуй повторить запрос."));
      return;
    }
    const book = books[Math.floor(Math.random() * books.length)];
    const card = document.createElement("div");
    card.className = "character-card";
    const title = document.createElement("h4");
    title.textContent = book.title || "Название не указано";
    card.append(title);
    if (Array.isArray(book.author_name) && book.author_name.length) {
      const author = document.createElement("p");
      const label = document.createElement("strong");
      label.textContent = "Автор: ";
      author.append(label, document.createTextNode(book.author_name.slice(0, 3).join(", ")));
      card.append(author);
    }
    if (book.first_publish_year) {
      const year = document.createElement("p");
      const label = document.createElement("strong");
      label.textContent = "Первое издание: ";
      year.append(label, document.createTextNode(String(book.first_publish_year)));
      card.append(year);
    }
    if (book.key) {
      const link = document.createElement("a");
      link.href = `https://openlibrary.org${book.key}`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.className = "text-link";
      link.textContent = "Открыть запись в библиотеке";
      card.append(link);
    }
    result.replaceChildren(card);
  } catch (error) {
    result.replaceChildren(message(error.message || "Не удалось связаться с Open Library.", "error"));
  } finally {
    button.disabled = false;
  }
}

function message(text, kind = "") {
  const element = document.createElement("p");
  element.className = `widget-message ${kind}`.trim();
  element.textContent = text;
  return element;
}

document.querySelector("#potter-refresh").addEventListener("click", loadPotterCharacter);
document.querySelector("#openlibrary-refresh").addEventListener("click", loadOpenLibraryBook);
loadPotterCharacter();
loadOpenLibraryBook();
