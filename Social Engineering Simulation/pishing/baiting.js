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
                id: "scene1", label: "Scene 1 – The Bait", steps: [
                    { speaker: "user", text: "I'm walking through the office parking lot.\nI spot a USB drive on the ground.", center: { view: "usb" } },
                    { speaker: "user", text: "The label reads:\n📁 Employee Salary Data\n\nThat's interesting… maybe someone dropped it?", center: { view: "usb", spotlight: "label" } },
                    { speaker: "phisher", text: "Curiosity is the bait.\nI left that USB there on purpose — waiting for someone to pick it up.", center: { view: "usb", reveal: true } },
                ]
            },
            {
                id: "scene2", label: "Scene 2 – The Mistake", steps: [
                    { speaker: "user", text: "I bring the USB back to my desk and plug it in.\nLet me just see what's on it…", center: { view: "plugged" }, effect: "glitch" },
                    { speaker: "phisher", text: "The moment the USB is plugged in, malware installs automatically.\nNo warning. No click needed. Just the connection.", center: { view: "malware" }, effect: "glitch" },
                ]
            },
            {
                id: "scene3", label: "Scene 3 – Consequence", steps: [
                    { speaker: "phisher", text: "The attacker now has access to the system.\nFiles can be stolen. Keystrokes can be logged.", center: { view: "consequences" }, effect: "glitch" },
                    { speaker: "phisher", text: "From one USB drive:\n- Malware spreads through the network\n- Confidential data is exfiltrated\n- The attacker has persistent access", center: { view: "consequences", expanded: true }, effect: "glitch" },
                ]
            },
            {
                id: "scene4", label: "Scene 4 – Lesson", steps: [
                    { speaker: "user", text: "I should never have plugged that in.\nSo how do I protect myself and my organization?", center: { view: "lesson" }, effect: "safePulse" },
                    { speaker: "user", text: "Key defenses:\n- Never plug unknown USB drives into your computer\n- Report suspicious devices to IT\n- Use endpoint protection software\n- Disable USB auto-run features", center: { view: "lesson", checklist: true }, effect: "safePulse" },
                    { speaker: "user", text: "Baiting exploits human curiosity.\nAn unknown USB drive is not a gift — it's a weapon.\n\nAlways report. Never plug in.", center: { view: "ending" } },
                ]
            },
        ]
    };

    const state = { sceneId: "scene1", stepIndex: 0, typing: { active: false, target: null, fullText: "", index: 0, timer: null } };

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

    function renderUSB(c) {
        let extra = c?.reveal ? '<div class="callout callout--danger" style="margin-top:10px;"><strong>⚠ This is a baiting attack!</strong> The USB was planted deliberately to exploit curiosity.</div>' : '';
        ui.center.innerHTML = `<div class="card"><div class="card__hdr"><span class="pill">📍 Parking Lot</span><div class="monoSmall">Office Building — Ground Floor</div></div><div class="dashboard" style="text-align:center;"><div style="font-size:64px;margin:20px 0;">💾</div><div class="balance">USB Drive Found</div><div class="balanceSub">Label: "Employee Salary Data"</div>${c?.spotlight === "label" ? '<div class="callout" style="margin-top:14px;text-align:left;"><strong>The label is designed to trigger curiosity.</strong><br>Who wouldn\'t want to peek at salary data?</div>' : ''}${extra}</div></div>`;
        ui.hint.textContent = c?.reveal ? "The USB was planted as bait." : "Found a USB… tempting?";
    }

    function renderPlugged() {
        ui.center.innerHTML = `<div class="card"><div class="card__hdr"><span class="pill" style="border-color:rgba(255,204,0,0.4);color:rgba(255,204,0,0.95);">⚠ USB Connected</span><div class="monoSmall">Workstation — Alex's desk</div></div><div class="dashboard"><div class="callout callout--danger"><strong>USB plugged in!</strong><br>The operating system begins reading the device…</div><div class="activityRow"><div class="activityRow__left"><div class="activityRow__title">💾 USB Device Detected</div><div class="activityRow__meta">Auto-mount enabled — scanning contents…</div></div><div class="delta delta--out">ACTIVE</div></div></div></div>`;
        ui.hint.textContent = "The damage starts the moment the USB is connected.";
    }

    function renderMalware() {
        ui.center.innerHTML = `<div class="card"><div class="card__hdr"><span class="pill" style="border-color:rgba(255,45,85,0.5);color:rgba(255,45,85,0.95);">🦠 Malware Installed</span></div><div class="dashboard"><div class="activity"><div class="activityRow"><div class="activityRow__left"><div class="activityRow__title">🦠 Payload executed</div><div class="activityRow__meta">Hidden script ran automatically on connection</div></div><div class="delta delta--out">INFECTED</div></div><div class="activityRow"><div class="activityRow__left"><div class="activityRow__title">🔓 Backdoor opened</div><div class="activityRow__meta">Remote access established to attacker</div></div><div class="delta delta--out">ACTIVE</div></div><div class="activityRow"><div class="activityRow__left"><div class="activityRow__title">📡 Data exfiltration</div><div class="activityRow__meta">Files being copied to remote server</div></div><div class="delta delta--out">SENDING</div></div></div></div></div>`;
        ui.hint.textContent = "Malware installed silently — no user interaction needed.";
    }

    function renderConsequences(c) {
        const items = [["🦠", "Malware infection", "Hidden scripts execute on plug-in"], ["📂", "Data theft", "Confidential files exfiltrated"], ["🔑", "Keylogging", "Every keystroke recorded by attacker"], ["🌐", "Network spread", "Malware propagates to other machines"]];
        ui.center.innerHTML = `<div class="card"><div class="card__hdr"><span class="pill" style="border-color:rgba(255,45,85,0.4);color:rgba(255,45,85,0.95);">💀 Consequences</span></div><div class="dashboard"><div class="activity">${items.map(i => `<div class="activityRow"><div class="activityRow__left"><div class="activityRow__title">${i[0]} ${i[1]}</div><div class="activityRow__meta">${i[2]}</div></div><div class="delta delta--out">RISK</div></div>`).join("")}</div>${c?.expanded ? '<div class="callout callout--danger" style="margin-top:10px;"><strong>One USB drive = full system compromise.</strong></div>' : ''}</div></div>`;
    }

    function renderLesson(c) {
        ui.center.innerHTML = `<div class="card"><div class="card__hdr"><span class="pill">🛡 Defenses</span></div><div class="lesson"><div class="callout callout--good"><strong>Baiting defense:</strong> Never let curiosity override security.</div>${c?.checklist ? '<div class="card" style="border-color:rgba(217,255,233,0.12);"><div class="card__hdr"><span class="pill">Defensive actions</span></div><div class="lesson" style="padding-top:10px;"><ul class="list"><li>Never plug unknown USB drives into your computer</li><li>Report suspicious devices to IT immediately</li><li>Use endpoint protection software</li><li>Disable USB auto-run features</li></ul></div></div>' : ''}</div></div>`;
    }

    function renderEnding() {
        try { const l = JSON.parse(localStorage.getItem("cyberLevels") || "{}"); l.level4 = true; localStorage.setItem("cyberLevels", JSON.stringify(l)); } catch (e) { }
        try { localStorage.setItem("baiting_complete", "true"); } catch (e) { }
        levelComplete();
        ui.center.innerHTML = `<div class="card"><div class="card__hdr"><span class="pill">✅ Level 4 Complete</span></div><div class="lesson"><div class="callout callout--good"><strong>Final message:</strong><br>Baiting exploits human curiosity. An unknown USB drive is not a gift — it's a weapon.<br><br><strong>Always report. Never plug in.</strong></div><div class="callout">🎉 All levels complete! You've finished the Cybersecurity Awareness Training.</div></div></div>`;
        ui.hint.textContent = "✔ Level 4 Complete — Baiting. All levels finished!";
    }

    function renderCenter(step) {
        const c = step.center || {};
        if (c.view === "usb") return renderUSB(c);
        if (c.view === "plugged") return renderPlugged();
        if (c.view === "malware") return renderMalware();
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

    function enableImageFallback(a, b) { const i = document.querySelector(a), f = document.querySelector(b); if (!i || !f) return; i.addEventListener("error", () => { i.style.display = "none"; f.style.display = "block"; }); }
    enableImageFallback(".char--user .char__img", ".char__imgFallback--user");
    enableImageFallback(".char--phisher .char__img", ".char__imgFallback--phisher");
    render();
})();
