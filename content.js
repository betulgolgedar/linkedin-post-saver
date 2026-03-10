// =============================================
// LinkedIn Post Saver - content.js
// LinkedIn sayfasına inject edilir.
// Postları yakalar, "Kaydet" butonu ekler.
// =============================================

const SAVE_BTN_CLASS = "lps-save-btn";
// LinkedIn 2025 yeni DOM yapısı: role="listitem" + componentkey içinde "FeedType"
const POST_SELECTOR = '[role="listitem"][componentkey*="FeedType"]';

// -----------------------------------------------
// 1) Post verilerini DOM'dan çıkar
// -----------------------------------------------
function extractPostData(postEl) {
  // Yazar adı ve URL — LinkedIn artık /in/ veya /company/ linkleri kullanıyor
  const authorLinkEl =
    postEl.querySelector('a[href*="/in/"]') ||
    postEl.querySelector('a[href*="/company/"]');
  const authorNameEl = authorLinkEl?.querySelector("p, span[class]");
  const author =
    authorNameEl?.innerText?.trim() ||
    authorLinkEl?.innerText?.trim() ||
    "Bilinmeyen";
  const authorUrl = authorLinkEl?.href || "";

  // Post metni — data-testid="expandable-text-box" kullanılıyor
  const textEl = postEl.querySelector('[data-testid="expandable-text-box"]');
  const text = textEl?.innerText?.trim() || "";

  // Benzersiz ID: componentkey attribute'undan al
  const componentKey = postEl.getAttribute("componentkey") || `lps_${Date.now()}`;

  // Post URL — feed/update linki varsa al
  const activityLink = postEl.querySelector('a[href*="/feed/update/"]');
  const postUrl = activityLink?.href || window.location.href;

  // Zaman — "11h •" gibi metni içeren paragraf
  const timeEl = postEl.querySelector('p[class*="c6863ad0"], time');
  const time = timeEl?.innerText?.replace(/•.*/g, "").trim() || "";

  return {
    id: componentKey,
    author,
    authorUrl,
    text: text.slice(0, 500),
    postUrl,
    time,
    savedAt: new Date().toISOString(),
    tags: [],
  };
}

// -----------------------------------------------
// 2) Kaydet butonunu oluştur
// -----------------------------------------------
function createSaveButton(postEl) {
  const btn = document.createElement("button");
  btn.className = SAVE_BTN_CLASS;
  btn.title = "LinkedIn Post Saver ile Kaydet";
  btn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
    <span>Kaydet</span>
  `;

  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const postData = extractPostData(postEl);
    await savePost(postData);

    // Buton state'ini güncelle
    btn.classList.add("lps-saved");
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
      <span>Kaydedildi</span>
    `;
    btn.disabled = true;

    showToast(`✓ "${postData.author}" postu kaydedildi`);
  });

  return btn;
}

// -----------------------------------------------
// 3) Chrome Storage'a kaydet
// -----------------------------------------------
function isContextValid() {
  try { return !!chrome.runtime?.id; } catch { return false; }
}

async function savePost(postData) {
  if (!isContextValid()) {
    showToast("⚠️ Sayfayı yenile (F5) ve tekrar dene");
    return;
  }
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(["posts"], (result) => {
        if (chrome.runtime.lastError) { resolve(); return; }
        const posts = result.posts || [];
        if (!posts.some((p) => p.id === postData.id)) {
          posts.unshift(postData);
        }
        chrome.storage.local.set({ posts: posts.slice(0, 20) }, resolve);
      });
    } catch { resolve(); }
  });
}

// -----------------------------------------------
// 4) Toast bildirimi
// -----------------------------------------------
function showToast(message) {
  const existing = document.querySelector(".lps-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "lps-toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("lps-toast-show"), 10);
  setTimeout(() => {
    toast.classList.remove("lps-toast-show");
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// -----------------------------------------------
// 5) Her yeni post için butonu inject et
// -----------------------------------------------
function findActionBar(postEl) {
  // SVG id="thumbs-up-outline-small" dil bağımsız — TR/EN/her dilde çalışır
  const likeIcon = postEl.querySelector('svg[id="thumbs-up-outline-small"]');
  if (!likeIcon) return null;

  // Yukarı çık: direkt child olarak en az 2 button/a içeren container = action bar
  let el = likeIcon.parentElement;
  while (el && el !== postEl) {
    const directBtnsLinks = [...el.children].filter(
      (c) => c.tagName === "BUTTON" || c.tagName === "A"
    );
    if (directBtnsLinks.length >= 2) return el;
    el = el.parentElement;
  }
  return null;
}

function injectButtons() {
  const posts = document.querySelectorAll(POST_SELECTOR);
  posts.forEach((postEl) => {
    // Zaten buton eklenmiş mi?
    if (postEl.querySelector(`.${SAVE_BTN_CLASS}`)) return;

    const actionBar = findActionBar(postEl);
    if (!actionBar) return;

    const btn = createSaveButton(postEl);

    // Daha önce kaydedilmişse işaretle
    const componentKey = postEl.getAttribute("componentkey") || "";
    if (!isContextValid()) return;
    chrome.storage.local.get(["posts"], (result) => {
      const savedPosts = result.posts || [];
      if (savedPosts.some((p) => p.id === componentKey)) {
        btn.classList.add("lps-saved");
        btn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          <span>Kaydedildi</span>
        `;
        btn.disabled = true;
      }
    });

    actionBar.appendChild(btn);
  });
}

// -----------------------------------------------
// 6) MutationObserver: Infinite scroll için
//    LinkedIn dinamik yüklüyor, her yeni post
//    geldiğinde butonları yeniden inject et
// -----------------------------------------------
// Debounce: art arda gelen DOM değişikliklerini 500ms bekleyip tek seferde işle
let debounceTimer = null;
const observer = new MutationObserver(() => {
  if (!isContextValid()) { observer.disconnect(); return; }
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(injectButtons, 500);
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// İlk yüklemede çalıştır
injectButtons();

console.log("[LinkedIn Post Saver] Yüklendi ✓");
