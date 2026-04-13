(() => {
    "use strict";
    const $ = (sel) => document.querySelector(sel);
    const ui = {
        sceneLabel: $("#uiSceneLabel"), panelTitle: $("#uiPanelTitle"), panelMeta: $("#uiPanelMeta"),
        center: $("#uiCenter"), userBubble: $("#uiUserBubble"), phisherBubble: $("#uiPhisherBubble"),
        userText: $("#uiUserText"), phisherText: $("#uiPhisherText"), hint: $("#uiHint"),
        choices: $("#uiChoices"), continueBtn: $("#uiContinueBtn"), homeBtn: $("#uiHomeBtn"), restartBtn: $("#uiRestartBtn"),
    };

    const STORY = {
        scenes: [
            {
                id: "scene1", label: "Scene 1 – The Warning", steps: [
                    { speaker: "user", text: "I'm just browsing the web, looking for some software tools…", center: { view: "browser" } },
                    { speaker: "user", text: "Wait, a massive pop-up just took over my screen!\n\n⚠ WARNING! Your computer is infected with 5 viruses!", center: { view: "popup" }, effect: "glitch" },
                    { speaker: "phisher", text: "Fear is a powerful weapon.\nI use alarming red text, flashing alerts, and countdowns to hijack logical thinking.", center: { view: "popup", highlight: true } },
                ]
            },
            {
                id: "scene2", label: "Scene 2 – The Trap", steps: [
                    { speaker: "user", text: "It says I have to click a button to clean my system immediately.\nShould I click it?", center: { view: "trap" } },
                    { speaker: "phisher", text: "If the user clicks that \"Fix Now\" button, they won't clean their system.\nThey'll actually download my fake antivirus program.", center: { view: "trap", reveal: true }, effect: "glitch" },
                    { speaker: "phisher", text: "This is called Scareware.\nAttackers scare users into voluntarily installing malware disguised as a security solution.", center: { view: "explain" } },
                ]
            },
            {
                id: "scene3", label: "Scene 3 – Consequence", steps: [
                    { speaker: "phisher", text: "The fake antivirus software does exactly what I designed it to do.", center: { view: "consequences" }, effect: "glitch" },
                    { speaker: "phisher", text: "It installs real malware, steals financial data when they \"purchase\" the full version, and completely compromises the system.", center: { view: "consequences", expanded: true }, effect: "glitch" },
                ]
            },
            {
                id: "scene4", label: "Scene 4 – Lesson", steps: [
                    { speaker: "user", text: "Legitimate antivirus software doesn't appear through random browser pop-ups.\nI must always verify security alerts through my actual OS.", center: { view: "lesson" }, effect: "safePulse" },
                    { speaker: "user", text: "Don't panic when you see alarming pop-ups.\nClose the browser tab and stay calm. Never click the links within them.", center: { view: "lesson", checklist: true }, effect: "safePulse" },
                    { speaker: "user", text: "Don't panic when you see alarming pop-ups.\nStay calm and verify before taking action.", center: { view: "ending" } },
                ]
            },
        ]
    };

    const state = { sceneId: "scene1", stepIndex: 0, typing: { active: false, target: null, fullText: "", index: 0, timer: null } };
    const runtime = {
        trap: {
            scanActive: false,
            scanDone: false,
            scanTimer: null,
            progress: 0,
        },
    };

    function getScene(id) { return STORY.scenes.find(s => s.id === id); }
    function getStep() { return getScene(state.sceneId).steps[state.stepIndex]; }
    function nextStep() {
        const scene = getScene(state.sceneId); const next = state.stepIndex + 1;
        if (next < scene.steps.length) { state.stepIndex = next; render(); return; }
        const idx = STORY.scenes.findIndex(s => s.id === state.sceneId);
        const ns = STORY.scenes[idx + 1];
        if (ns) { state.sceneId = ns.id; state.stepIndex = 0; render(); }
    }

    function clearTyping() { if (state.typing.timer != null) clearTimeout(state.typing.timer); Object.assign(state.typing, { active: false, target: null, fullText: "", index: 0, timer: null }); }
    function finishTyping() { if (!state.typing.active || !state.typing.target) return; state.typing.target.textContent = state.typing.fullText; const c = document.createElement("span"); c.className = "typeCursor"; state.typing.target.appendChild(c); clearTyping(); updateContinue(); }
    function typeInto(target, text) {
        clearTyping(); Object.assign(state.typing, { active: true, target, fullText: text, index: 0 }); target.textContent = "";
        const tick = () => { if (!state.typing.active) return; const t = state.typing.target, i = state.typing.index; if (i >= state.typing.fullText.length) { finishTyping(); return; } t.textContent += state.typing.fullText.charAt(i); state.typing.index++; const c = document.createElement("span"); c.className = "typeCursor"; t.appendChild(c); state.typing.timer = setTimeout(tick, 14 + Math.floor(Math.random() * 12)); };
        state.typing.timer = setTimeout(tick, 40);
    }

    function renderBrowser() {
        ui.center.innerHTML = `<div class="card"><div class="browserBar"><div class="dotRow"><span class="dot dot--r"></span><span class="dot dot--y"></span><span class="dot dot--g"></span></div><div class="address">https://www.software-tools-search.com</div></div><div class="dashboard" style="text-align:center;"><div style="font-size:42px;margin:20px 0;">🌐</div><div class="balance">Browsing Web...</div></div></div>`;
        ui.hint.textContent = "Just typical web browsing.";
    }

    function renderPopup(c) {
        const style = c.highlight ? 'border:2px solid rgba(255,45,85,0.8);box-shadow:0 0 20px rgba(255,45,85,0.4);' : '';
        ui.center.innerHTML = `<div class="card" style="border-color:rgba(255,45,85,0.6);${style}"><div class="card__hdr" style="background:rgba(255,45,85,0.1);"><span class="pill" style="border-color:rgba(255,45,85,0.4);color:rgba(255,45,85,0.95);">⚠ SYSTEM ALERT</span></div><div class="dashboard" style="text-align:center;padding:30px 20px;"><div style="font-size:48px;margin-bottom:10px;">🛡️</div><h2 style="color:var(--danger);margin:0 0 10px;text-transform:uppercase;font-size:24px;">WARNING!</h2><p style="font-size:16px;line-height:1.4;margin:0 0 20px;">Your computer is infected with <strong>5 viruses!</strong><br>System damage is imminent.</p></div></div>`;
        ui.hint.textContent = c.highlight ? "Fear overrides logic." : "The pop-up is designed to induce panic.";
    }

    function renderTrap(c) {
        const extra = c.reveal ? '<div class="callout callout--danger" style="margin-top:15px;"><strong>Malignant Trap:</strong> The "cleaning tool" is the actual malware!</div>' : '';
        ui.center.innerHTML = `<div class="card scarewareTrapCard" id="scarewareTrapCard"><div class="dashboard" style="text-align:center;"><p style="font-size:16px;line-height:1.4;margin:0 0 20px;">Click here to clean your system immediately!</p><button type="button" class="btn btn--primary js-fixnow-btn" style="background:#ff2d55;border-color:#ff2d55;font-size:16px;padding:12px 30px;">FIX NOW</button>
          <div class="scarewareScanBox" id="scarewareScanBox" hidden style="margin-top:16px;text-align:left;">
            <div class="monoSmall" style="margin-bottom:8px;color:rgba(255,210,220,0.95);letter-spacing:0.08em;text-transform:uppercase;">System scan</div>
            <div class="scarewareScanRow">
              <div class="scarewareScanStatus" id="scarewareScanStatus">Waiting…</div>
              <div class="scarewareScanPct" id="scarewareScanPct">0%</div>
            </div>
            <div class="scarewareScanBar" aria-hidden="true"><div class="scarewareScanBar__fill" id="scarewareScanFill" style="width:0%"></div></div>
            <div class="callout callout--danger scarewareCompromiseMsg" id="scarewareCompromiseMsg" hidden style="margin-top:12px;">
              <strong>Compromised:</strong> The “Fix Now” download installed rogue software. Your system is now under attacker control.
            </div>
          </div>
          ${extra}</div></div>`;
        ui.hint.textContent = "The solution is the poison.";
    }

    function renderExplain() {
        ui.center.innerHTML = `<div class="card"><div class="card__hdr"><span class="pill">📖 What is Scareware?</span></div><div class="lesson"><div class="callout callout--danger"><strong>Scareware</strong> uses fake security warnings to frighten victims into downloading rogue software or paying for useless "antivirus" products.</div><div class="callout"><strong>The Psychology:</strong><br>• Urgency implies immediate loss<br>• Technical jargon confuses the user<br>• The attacker provides the "solution" to the fear they just created</div></div></div>`;
        ui.hint.textContent = "Scareware exploits the user's desire to keep their device safe.";
    }

    function renderConsequences(c) {
        const items = [["🦠", "Malware installation", "The 'fix' deploys real ransomware or trojans"], ["🕵️", "Stolen data", "Financial details extracted during fake software 'purchase'"], ["💻", "System compromise", "Persistent backdoor access established"]];
        ui.center.innerHTML = `<div class="card"><div class="card__hdr"><span class="pill" style="border-color:rgba(255,45,85,0.4);color:rgba(255,45,85,0.95);">💀 Consequences</span></div><div class="dashboard"><div class="activity">${items.map(i => `<div class="activityRow"><div class="activityRow__left"><div class="activityRow__title">${i[0]} ${i[1]}</div><div class="activityRow__meta">${i[2]}</div></div><div class="delta delta--out">RISK</div></div>`).join("")}</div>${c?.expanded ? '<div class="callout callout--danger" style="margin-top:10px;"><strong>The victim pays to infect their own computer.</strong></div>' : ''}</div></div>`;
    }

    function renderLesson(c) {
        ui.center.innerHTML = `<div class="card"><div class="card__hdr"><span class="pill">🛡 Defenses</span></div><div class="lesson"><div class="callout callout--good"><strong>Scareware defense:</strong> Legitimate software does not scream at you through browser pop-ups.</div>${c?.checklist ? '<div class="card" style="border-color:rgba(217,255,233,0.12);"><div class="card__hdr"><span class="pill">Defensive actions</span></div><div class="lesson" style="padding-top:10px;"><ul class="list"><li>Never click links inside alarming pop-ups</li><li>Close the browser tab immediately (use Task Manager if frozen)</li><li>Always verify alerts using your actual installed OS security center</li></ul></div></div>' : ''}</div></div>`;
    }

    function renderEnding() {
        try { const l = JSON.parse(localStorage.getItem("cyberLevels") || "{}"); l.level5 = true; localStorage.setItem("cyberLevels", JSON.stringify(l)); } catch (e) { }
        try { localStorage.setItem("scareware_complete", "true"); } catch (e) { }
        levelComplete();
        ui.center.innerHTML = `<div class="card"><div class="card__hdr"><span class="pill">✅ Level 5 Complete</span></div><div class="lesson"><div class="callout callout--good"><strong>Final message:</strong><br>Don't panic when you see alarming pop-ups.<br>Stay calm and verify before taking action.</div><div class="callout">Return to the menu to continue.</div></div></div>`;
        ui.hint.textContent = "✔ Level 5 Complete — Scareware.";
    }

    function renderCenter(step) {
        const c = step.center || {};
        if (c.view === "browser") return renderBrowser();
        if (c.view === "popup") return renderPopup(c);
        if (c.view === "trap") return renderTrap(c);
        if (c.view === "explain") return renderExplain();
        if (c.view === "consequences") return renderConsequences(c);
        if (c.view === "lesson") return renderLesson(c);
        if (c.view === "ending") return renderEnding();
    }

    function setEffect(effect) {
        const a = $("#app"); a.classList.remove("is-compromised", "is-safePulse");
        if (effect === "glitch") a.classList.add("is-compromised");
        if (effect === "safePulse") { a.classList.add("is-safePulse"); setTimeout(() => a.classList.remove("is-safePulse"), 950); }
    }

    function renderBubbles(step) {
        const isU = step.speaker === "user";
        ui.userBubble.style.opacity = isU ? "1" : "0.5"; ui.phisherBubble.style.opacity = isU ? "0.5" : "1";
        ui.userText.textContent = ""; ui.phisherText.textContent = "";
        typeInto(isU ? ui.userText : ui.phisherText, step.text);
    }

    function updateContinue() {
        ui.continueBtn.disabled = false;
        ui.continueBtn.textContent = state.typing.active ? "Skip" : "Continue";
    }

    function render() {
        const step = getStep(), scene = getScene(state.sceneId);
        ui.sceneLabel.textContent = scene.label; ui.panelTitle.textContent = scene.label.toUpperCase();
        ui.panelMeta.textContent = `Step ${state.stepIndex + 1}/${scene.steps.length}`;
        if (step.effect === "glitch") setEffect("glitch"); else if (step.effect === "safePulse") setEffect("safePulse"); else setEffect("none");
        renderCenter(step); renderBubbles(step); updateContinue();
    }

    function levelComplete() {
        if (ui.continueBtn) ui.continueBtn.style.display = "none";
        if (ui.homeBtn) ui.homeBtn.style.display = "inline-block";
    }

    ui.continueBtn.addEventListener("click", () => { if (state.typing.active) { finishTyping(); return; } nextStep(); });
    ui.restartBtn.addEventListener("click", () => { clearTyping(); state.sceneId = "scene1"; state.stepIndex = 0; render(); });
    if (ui.homeBtn) ui.homeBtn.addEventListener("click", () => { window.location.href = "index.html"; });
    window.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); ui.continueBtn.click(); } });

    function clearTrapTimers() {
        if (runtime.trap.scanTimer != null) clearInterval(runtime.trap.scanTimer);
        runtime.trap.scanTimer = null;
    }

    function startFakeScanSequence() {
        if (runtime.trap.scanActive || runtime.trap.scanDone) return;
        runtime.trap.scanActive = true;
        runtime.trap.progress = 0;

        const btn = ui.center.querySelector(".js-fixnow-btn");
        const box = document.getElementById("scarewareScanBox");
        const status = document.getElementById("scarewareScanStatus");
        const pct = document.getElementById("scarewareScanPct");
        const fill = document.getElementById("scarewareScanFill");
        const msg = document.getElementById("scarewareCompromiseMsg");
        const card = document.getElementById("scarewareTrapCard");

        if (btn) btn.disabled = true;
        if (box) box.removeAttribute("hidden");
        if (msg) msg.setAttribute("hidden", "");
        if (card) card.classList.add("is-scanning");

        const stages = [
            { at: 8, text: "Initializing scan engine…" },
            { at: 22, text: "Scanning browser cache…" },
            { at: 45, text: "Searching for threats…" },
            { at: 68, text: "Critical infections detected…" },
            { at: 90, text: "Attempting automatic cleanup…" },
        ];

        clearTrapTimers();
        runtime.trap.scanTimer = setInterval(() => {
            runtime.trap.progress = Math.min(100, runtime.trap.progress + (3 + Math.floor(Math.random() * 6)));
            const p = runtime.trap.progress;
            const stage = stages.slice().reverse().find(s => p >= s.at);
            if (status) status.textContent = stage ? stage.text : "Scanning…";
            if (pct) pct.textContent = `${p}%`;
            if (fill) fill.style.width = `${p}%`;

            if (p >= 100) {
                clearTrapTimers();
                runtime.trap.scanActive = false;
                runtime.trap.scanDone = true;
                if (card) {
                    card.classList.remove("is-scanning");
                    card.classList.add("is-compromisedTrap");
                }
                if (status) status.textContent = "Download executed.";
                if (msg) msg.removeAttribute("hidden");

                // Let the player see the compromise, then continue dialogue normally.
                setTimeout(() => {
                    nextStep();
                }, 900);
            }
        }, 140);
    }

    // FIX NOW interaction (event delegation)
    ui.center.addEventListener("click", (e) => {
        const btn = e.target.closest(".js-fixnow-btn");
        if (!btn || btn.disabled) return;
        // Only interactive in Scene 2 – The Trap (step 0)
        if (!(state.sceneId === "scene2" && state.stepIndex === 0)) return;
        e.preventDefault();
        startFakeScanSequence();
    });

    function enableImageFallback(a, b) { const i = document.querySelector(a), f = document.querySelector(b); if (!i || !f) return; i.addEventListener("error", () => { i.style.display = "none"; f.style.display = "block"; }); }
    enableImageFallback(".char--user .char__img", ".char__imgFallback--user");
    enableImageFallback(".char--phisher .char__img", ".char__imgFallback--phisher");
    render();
})();
