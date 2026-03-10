// =============================================
// LinkedIn Post Saver - popup.js
// Popup arayüzünü yönetir
// =============================================

const FREE_LIMIT = 20;

let allPosts = [];

// -----------------------------------------------
// 1) Sayfa yüklenince postları çek
// -----------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  loadPosts();

  document.getElementById("search").addEventListener("input", (e) => {
    renderPosts(filterPosts(e.target.value));
  });

  document.getElementById("clear-btn").addEventListener("click", clearAll);
  document.getElementById("upgrade-btn").addEventListener("click", () => {
    chrome.tabs.create({ url: "https://betulgolgedar.github.io/linkedin-post-saver/" });
  });
});

// -----------------------------------------------
// 2) Storage'dan postları yükle
// -----------------------------------------------
function loadPosts() {
  chrome.storage.local.get(["posts", "settings"], (result) => {
    allPosts = result.posts || [];
    updateLimitBar(allPosts.length);
    renderPosts(allPosts);
  });
}

// -----------------------------------------------
// 3) Limit barını güncelle
// -----------------------------------------------
function updateLimitBar(count) {
  const pct = Math.min((count / FREE_LIMIT) * 100, 100);
  document.getElementById("limit-fill").style.width = `${pct}%`;
  document.getElementById("limit-text").textContent = `${count} / ${FREE_LIMIT} kayıt`;

  if (count >= FREE_LIMIT) {
    document.getElementById("limit-text").style.color = "#EF4444";
  }
}

// -----------------------------------------------
// 4) Postları filtrele
// -----------------------------------------------
function filterPosts(query) {
  if (!query.trim()) return allPosts;
  const q = query.toLowerCase();
  return allPosts.filter(
    (p) =>
      p.author.toLowerCase().includes(q) ||
      p.text.toLowerCase().includes(q) ||
      (p.tags || []).some((t) => t.toLowerCase().includes(q))
  );
}

// -----------------------------------------------
// 5) Postları render et
// -----------------------------------------------
function renderPosts(posts) {
  const container = document.getElementById("posts-list");

  if (!posts.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔖</div>
        <div class="empty-title">Henüz kayıtlı post yok</div>
        <div class="empty-desc">
          LinkedIn akışında herhangi bir postun<br/>
          altındaki <strong style="color:#0077B5">Kaydet</strong> butonuna tıkla.
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = posts.map((post) => createPostCard(post)).join("");

  // Event listener'ları ekle
  container.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      deletePost(btn.dataset.id);
    });
  });

  container.querySelectorAll(".add-tag-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      addTag(btn.dataset.id);
    });
  });

  container.querySelectorAll(".tag").forEach((tag) => {
    tag.addEventListener("click", (e) => {
      e.stopPropagation();
      document.getElementById("search").value = tag.textContent;
      renderPosts(filterPosts(tag.textContent));
    });
  });
}

// -----------------------------------------------
// 6) Post kartı HTML'i
// -----------------------------------------------
function createPostCard(post) {
  const tags = (post.tags || [])
    .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
    .join("");

  const timeAgo = formatTimeAgo(post.savedAt);

  return `
    <div class="post-card">
      <div class="post-author">
        <a href="${escapeHtml(post.authorUrl)}" target="_blank">
          ${escapeHtml(post.author)}
        </a>
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:10px;color:#333">${timeAgo}</span>
          <button class="delete-btn" data-id="${escapeHtml(post.id)}" title="Sil">✕</button>
        </div>
      </div>
      <div class="post-text">${escapeHtml(post.text) || "—"}</div>
      <div class="post-tags">
        ${tags}
        <button class="add-tag-btn" data-id="${escapeHtml(post.id)}">+ etiket</button>
      </div>
      <a class="post-link" href="${escapeHtml(post.postUrl)}" target="_blank">
        → LinkedIn'de Aç
      </a>
    </div>
  `;
}

// -----------------------------------------------
// 7) Etiket ekle
// -----------------------------------------------
function addTag(postId) {
  const tag = prompt("Etiket adı:");
  if (!tag || !tag.trim()) return;

  chrome.runtime.sendMessage(
    {
      type: "UPDATE_TAGS",
      id: postId,
      tags: [
        ...(allPosts.find((p) => p.id === postId)?.tags || []),
        tag.trim().toLowerCase(),
      ],
    },
    () => loadPosts()
  );
}

// -----------------------------------------------
// 8) Post sil
// -----------------------------------------------
function deletePost(postId) {
  chrome.runtime.sendMessage({ type: "DELETE_POST", id: postId }, () => {
    loadPosts();
  });
}

// -----------------------------------------------
// 9) Hepsini sil
// -----------------------------------------------
function clearAll() {
  if (!confirm("Tüm kayıtlı postlar silinsin mi?")) return;
  chrome.storage.local.set({ posts: [] }, () => loadPosts());
}

// -----------------------------------------------
// Yardımcı fonksiyonlar
// -----------------------------------------------
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatTimeAgo(isoStr) {
  if (!isoStr) return "";
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "şimdi";
  if (mins < 60) return `${mins}d önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}s önce`;
  return `${Math.floor(hrs / 24)} gün önce`;
}
