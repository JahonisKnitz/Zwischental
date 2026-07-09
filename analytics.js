// ═══════════════════════════════════════════════════════════════
//  Zwischental Analytics — GitHub API
//  Liest/schreibt analytics.json direkt ins GitHub-Repo.
//  Config (owner, repo, PAT) wird einmalig in localStorage gespeichert.
// ═══════════════════════════════════════════════════════════════

const ZW_ANALYTICS = (() => {
  const CONFIG_KEY = 'zw_analytics_config';
  const FILE_PATH  = 'analytics.json';

  // ── Config ───────────────────────────────────────────────────
  function getConfig() {
    try { return JSON.parse(localStorage.getItem(CONFIG_KEY)); } catch { return null; }
  }
  function saveConfig(cfg) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  }

  // ── GitHub API Helpers ────────────────────────────────────────
  function apiUrl(cfg) {
    return `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${FILE_PATH}`;
  }
  function headers(cfg) {
    return {
      'Authorization': `Bearer ${cfg.pat}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };
  }

  async function fetchAnalytics(cfg) {
    // Zuerst Default-Branch ermitteln
    const repoRes = await fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}`, { headers: headers(cfg) });
    if (!repoRes.ok) throw new Error(`Repo nicht gefunden (${repoRes.status}) — Owner/Repo-Name prüfen`);
    const repoInfo = await repoRes.json();
    const branch = repoInfo.default_branch || 'main';

    const res = await fetch(apiUrl(cfg) + `?ref=${branch}`, { headers: headers(cfg) });
    if (res.status === 404) return { data: { games: [] }, sha: null, branch };
    if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
    const json = await res.json();
    const text = decodeURIComponent(escape(atob(json.content.replace(/\n/g, ''))));
    return { data: JSON.parse(text), sha: json.sha, branch };
  }

  async function writeAnalytics(cfg, data, sha, branch = 'main') {
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
    const body = {
      message: `Analytics: Spiel ${data.games.length} — ${data.games.at(-1)?.totalVP ?? '?'} VP`,
      content,
      branch,
      ...(sha ? { sha } : {}),
    };
    const res = await fetch(apiUrl(cfg), {
      method: 'PUT',
      headers: headers(cfg),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`GitHub Write ${res.status}: ${errText}`);
    }
  }

  // ── Setup Modal ───────────────────────────────────────────────
  function showSetupModal(onSave) {
    const existing = document.getElementById('zw-analytics-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'zw-analytics-modal';
    modal.style.cssText = `
      position:fixed; inset:0; background:rgba(0,0,0,0.82);
      display:flex; align-items:center; justify-content:center;
      z-index:9999; font-family:'Pirata One',cursive;
    `;
    const cfg = getConfig() || {};
    modal.innerHTML = `
      <div style="background:#1a2a3a; border:1px solid #c79a3f55; border-radius:8px;
                  padding:28px 24px; max-width:320px; width:90%; color:#f0e0b0;">
        <div style="font-size:1.1rem; margin-bottom:16px; letter-spacing:0.05em;">
          ⚙ Analytics · GitHub Konfiguration
        </div>
        <div style="font-size:0.78rem; color:#a09070; margin-bottom:16px; font-family:sans-serif; line-height:1.5;">
          Speichert Spieldaten in <code>analytics.json</code> in deinem Repo.
          PAT braucht <code>contents:write</code> Rechte.
        </div>
        <label style="display:block; font-size:0.8rem; margin-bottom:4px;">GitHub Owner</label>
        <input id="zwa-owner" value="${cfg.owner||''}" placeholder="dein-username"
          style="width:100%; box-sizing:border-box; padding:7px 10px; margin-bottom:10px;
                 background:#0d1a26; border:1px solid #c79a3f44; border-radius:4px;
                 color:#f0e0b0; font-family:sans-serif; font-size:0.9rem;">
        <label style="display:block; font-size:0.8rem; margin-bottom:4px;">Repository</label>
        <input id="zwa-repo" value="${cfg.repo||''}" placeholder="zwischental"
          style="width:100%; box-sizing:border-box; padding:7px 10px; margin-bottom:10px;
                 background:#0d1a26; border:1px solid #c79a3f44; border-radius:4px;
                 color:#f0e0b0; font-family:sans-serif; font-size:0.9rem;">
        <label style="display:block; font-size:0.8rem; margin-bottom:4px;">Personal Access Token</label>
        <input id="zwa-pat" type="password" value="${cfg.pat||''}" placeholder="ghp_..."
          style="width:100%; box-sizing:border-box; padding:7px 10px; margin-bottom:18px;
                 background:#0d1a26; border:1px solid #c79a3f44; border-radius:4px;
                 color:#f0e0b0; font-family:sans-serif; font-size:0.9rem;">
        <div style="display:flex; gap:10px; justify-content:flex-end;">
          <button id="zwa-cancel"
            style="padding:7px 16px; background:transparent; border:1px solid #a09070;
                   border-radius:4px; color:#a09070; cursor:pointer; font-family:inherit;">
            Abbrechen
          </button>
          <button id="zwa-test"
            style="padding:7px 16px; background:transparent; border:1px solid #c79a3f;
                   border-radius:4px; color:#c79a3f; cursor:pointer; font-family:inherit;">
            Verbindung testen
          </button>
          <button id="zwa-save"
            style="padding:7px 16px; background:#c79a3f; border:none;
                   border-radius:4px; color:#1a1208; cursor:pointer; font-family:inherit; font-weight:700;">
            Speichern
          </button>
        </div>
        <div id="zwa-status" style="margin-top:10px; font-size:0.75rem; min-height:1em; font-family:sans-serif;"></div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#zwa-cancel').onclick = () => modal.remove();
    modal.querySelector('#zwa-save').onclick = () => {
      const owner = modal.querySelector('#zwa-owner').value.trim();
      const repo  = modal.querySelector('#zwa-repo').value.trim();
      const pat   = modal.querySelector('#zwa-pat').value.trim();
      if (!owner || !repo || !pat) {
        modal.querySelector('#zwa-status').textContent = '⚠ Alle Felder ausfüllen';
        return;
      }
      saveConfig({ owner, repo, pat });
      modal.querySelector('#zwa-status').style.color = '#6abf6a';
      modal.querySelector('#zwa-status').textContent = '✓ Gespeichert';
      setTimeout(() => { modal.remove(); if (onSave) onSave({ owner, repo, pat }); }, 800);
    };

    modal.querySelector('#zwa-test').onclick = async () => {
      const owner = modal.querySelector('#zwa-owner').value.trim();
      const repo  = modal.querySelector('#zwa-repo').value.trim();
      const pat   = modal.querySelector('#zwa-pat').value.trim();
      const statusEl = modal.querySelector('#zwa-status');
      statusEl.style.color = '#a09070';
      statusEl.textContent = 'Teste Verbindung…';
      try {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
          headers: { 'Authorization': `Bearer ${pat}`, 'Accept': 'application/vnd.github.v3+json' }
        });
        if (res.ok) {
          statusEl.style.color = '#6abf6a';
          statusEl.textContent = `✓ Repo gefunden: ${owner}/${repo}`;
        } else {
          const j = await res.json().catch(() => ({}));
          statusEl.style.color = '#c04040';
          statusEl.textContent = `✗ ${res.status}: ${j.message || 'Fehler'}`;
        }
      } catch(e) {
        statusEl.style.color = '#c04040';
        statusEl.textContent = `✗ Netzwerkfehler: ${e.message}`;
      }
    };

    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  }

  // ── Hauptfunktion: Spiel speichern ───────────────────────────
  // Nur speichern wenn Config bereits vorhanden — kein Modal im Spiel selbst.
  // Setup nur über analytics.html → ⚙ Konfiguration.
  async function save(gameData) {
    const cfg = getConfig();
    if (!cfg || !cfg.owner || !cfg.repo || !cfg.pat) return; // still überspringen
    await doSave(cfg, gameData);
  }

  async function doSave(cfg, gameData) {
    try {
      const { data, sha, branch } = await fetchAnalytics(cfg);
      data.games = data.games || [];
      data.games.push({ ...gameData });
      await writeAnalytics(cfg, data, sha, branch);
      showToastAnalytics('📊 Analytics gespeichert');
    } catch(e) {
      console.error('[Analytics]', e.message);
      showToastAnalytics(`⚠ ${e.message}`, true);
    }
  }

  function showToastAnalytics(msg, isError = false) {
    // Nutzt die bestehende showToast Funktion falls verfügbar
    if (typeof showToast === 'function') {
      showToast(msg);
      return;
    }
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
      background:${isError?'#8b2020':'#1a4060'};color:#f0e0b0;padding:8px 16px;
      border-radius:4px;font-family:'Pirata One',cursive;font-size:0.85rem;z-index:9998;`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  // ── Public API ────────────────────────────────────────────────
  return { save, showSetupModal, getConfig, saveConfig };
})();

// Globale Funktion die game.js aufruft
window.zwSaveAnalytics = (data) => ZW_ANALYTICS.save(data);
window.zwAnalyticsSetup = () => ZW_ANALYTICS.showSetupModal();
