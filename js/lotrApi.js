const API_BASE = "https://the-one-api.dev/v2";
let currentToken = "";

window.addEventListener("lotr-token-change", event => {
  currentToken = event.detail.token;
  window.dispatchEvent(new Event("lotr-api-refresh"));
});

export function hasToken() {
  return Boolean(currentToken);
}

export async function getLotrData(endpoint, signal) {
  if (!currentToken) {
    throw new Error("Сначала добавь токен в разделе «Настроить доступ к The One API».");
  }
  const response = await fetch(`${API_BASE}/${endpoint}`, {
    headers: { Authorization: `Bearer ${currentToken}` },
    signal
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Токен не принят. Проверь его в личном кабинете The One API.");
    }
    if (response.status === 429) {
      throw new Error("Слишком много запросов. Подожди немного и попробуй снова.");
    }
    throw new Error(`Сервис ответил ошибкой (${response.status}). Попробуй позже.`);
  }
  const data = await response.json();
  if (!Array.isArray(data.docs)) {
    throw new Error("Ответ API имеет неожиданный формат.");
  }
  return data.docs;
}
