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
                id: "scene1", label: "Scene 1 – Office Entrance", steps: [
                    { speaker: "user", text: "Morning! Just swiping my badge to enter the office.", center: { view: "door" } },
                    { speaker: "phisher", text: "Hey! I forgot my badge today. Can you hold the door for me? I've got my hands full with these coffees.", center: { view: "door", highlight: true }, effect: "glitch" },
                    { speaker: "phisher", text: "This is a common physical security trick.\nExploiting human politeness to bypass access controls.", center: { view: "door", reveal: true } },
                ]
            },
            {
                id: "scene2", label: "Scene 2 – The Mistake", steps: [
                    { speaker: "user", text: "Oh, sure, come on in. Don't want you to spill those.", center: { view: "entry" }, effect: "glitch" },
                    { speaker: "phisher", text: "I'm in.\nWithout scanning a badge, I've bypassed millions of dollars of cybersecurity.", center: { view: "entry", hacker: true }, effect: "glitch" },
                    { speaker: "phisher", text: "This is called Tailgating (or Piggybacking).\nAttackers gain physical access by following authorized employees into restricted areas.", center: { view: "explain" } },
                ]
            },
            {
                id: "scene3", label: "Scene 3 – Consequence", steps: [
                    { speaker: "phisher", text: "Now that I'm inside the building, the real attack begins.", center: { view: "consequences" }, effect: "glitch" },
                    { speaker: "phisher", text: "I can plug a rogue device into the network, steal physical documents, or access an unlocked workstation when someone walks away.", center: { view: "consequences", expanded: true }, effect: "glitch" },
                ]
            },
            {
                id: "scene4", label: "Scene 4 – Lesson", steps: [
                    { speaker: "user", text: "What should I have done differently?", center: { view: "lesson" }, effect: "safePulse" },
                    { speaker: "user", text: "Never allow unknown people to enter secure areas without proper authorization. Direct them to the reception desk or ask them to scan their own badge.", center: { view: "lesson", checklist: true }, effect: "safePulse" },
                    { speaker: "user", text: "Security isn't just digital. Politeness shouldn't overrule protocol.", center: { view: "ending" } },
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

    function renderDoor(c) {
        let extra = '';
        if (c.highlight) extra = '<div class="callout callout--danger" style="margin-top:15px;text-align:left;"><strong>The Request:</strong> A stranger asks to bypass security, using props (coffees) or a sense of urgency to make it awkward to say no.</div>';
        if (c.reveal) extra = '<div class="callout callout--danger" style="margin-top:15px;text-align:left;"><strong>Social Engineering:</strong> The attacker relies on you bypassing policy out of fear of seeming rude.</div>';

        ui.center.innerHTML = `<div class="card"><div class="card__hdr"><span class="pill">🏢 Main Entrance</span><div class="monoSmall">Office Building</div></div><div class="dashboard" style="text-align:center;"><div style="font-size:48px;margin:20px 0;">🚪</div><div class="balance">Secure Access Point</div><div class="balanceSub" style="color:#28ff98;">✓ Badge Scanned — Door Unlocked</div>${extra}</div></div>`;
        ui.hint.textContent = c.highlight ? "Will you enforce the rules or be polite?" : "The perimeter is secure — until a human opens the door.";
    }

    function renderEntry(c) {
        ui.center.innerHTML = `<div class="card"><div class="card__hdr"><span class="pill" style="border-color:rgba(255,45,85,0.4);color:rgba(255,45,85,0.95);">⚠ Unauthorized Entry</span></div><div class="dashboard" style="text-align:center;"><div style="font-size:48px;margin:20px 0;">🚶‍♂️🚶‍♂️</div><div class="balance">Tailgating Successful</div><div class="balanceSub" style="color:#ff2d55;">Log: 1 Badge Scan, 2 People Entered</div>${c.hacker ? '<div class="callout callout--danger" style="margin-top:15px;text-align:left;"><strong>Physical Breach:</strong> An attacker is now walking freely in the restricted area.</div>' : ''}</div></div>`;
        ui.hint.textContent = "The physical firewall was just bypassed.";
    }

    function renderExplain() {
        ui.center.innerHTML = `<div class="card"><div class="card__hdr"><span class="pill">📖 What is Tailgating?</span></div><div class="lesson"><div class="callout callout--danger"><strong>Tailgating</strong> (or Piggybacking) is a physical security breach where an unauthorized person follows an authorized person into a secure area.</div><div class="callout"><strong>Common Tactics:</strong><br>• Walking closely behind someone holding the door<br>• Pretending to forget a badge<br>• Carrying heavy boxes to solicit help<br>• Dressing as a delivery person or repair technician</div></div></div>`;
        ui.hint.textContent = "Tailgating turns the strongest digital security invisible by bypassing it entirely.";
    }

    function renderConsequences(c) {
        const items = [["🔌", "Device tampering", "Planting keyloggers or rogue access points"], ["🗄️", "Data theft", "Stealing physical files or unattended laptops"], ["🔓", "Workstation access", "Using unlocked computers left by employees"]];
        ui.center.innerHTML = `<div class="card"><div class="card__hdr"><span class="pill" style="border-color:rgba(255,45,85,0.4);color:rgba(255,45,85,0.95);">💀 Consequences</span></div><div class="dashboard"><div class="activity">${items.map(i => `<div class="activityRow"><div class="activityRow__left"><div class="activityRow__title">${i[0]} ${i[1]}</div><div class="activityRow__meta">${i[2]}</div></div><div class="delta delta--out">RISK</div></div>`).join("")}</div>${c?.expanded ? '<div class="callout callout--danger" style="margin-top:10px;"><strong>Internal systems often lack the strong defenses of the outer perimeter.</strong></div>' : ''}</div></div>`;
    }

    function renderLesson(c) {
        ui.center.innerHTML = `<div class="card"><div class="card__hdr"><span class="pill">🛡 Defenses</span></div><div class="lesson"><div class="callout callout--good"><strong>Tailgating defense:</strong> Enforce a strict "No Badge, No Entry" policy.</div>${c?.checklist ? '<div class="card" style="border-color:rgba(217,255,233,0.12);"><div class="card__hdr"><span class="pill">Defensive actions</span></div><div class="lesson" style="padding-top:10px;"><ul class="list"><li>Never hold the door for someone you don\'t know</li><li>Require every individual to swipe their own badge</li><li>Direct forgotten badge claims to reception/security</li><li>Report unknown or unescorted individuals</li></ul></div></div>' : ''}</div></div>`;
    }

    function renderEnding() {
        try { const l = JSON.parse(localStorage.getItem("cyberLevels") || "{}"); l.level8 = true; localStorage.setItem("cyberLevels", JSON.stringify(l)); } catch (e) { }
        try { localStorage.setItem("tailgating_complete", "true"); } catch (e) { }
        levelComplete();
        ui.center.innerHTML = `<div class="card"><div class="card__hdr"><span class="pill">✅ Level 8 Complete</span></div><div class="lesson"><div class="callout callout--good"><strong>Final message:</strong><br>Never allow unknown people to enter secure areas without proper authorization.<br>Security isn't just digital.</div><div class="callout">Return to the menu to continue.</div></div></div>`;
        ui.hint.textContent = "✔ Level 8 Complete — Tailgating.";
    }

    function renderCenter(step) {
        const c = step.center || {};
        if (c.view === "door") return renderDoor(c);
        if (c.view === "entry") return renderEntry(c);
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

    function enableImageFallback(a, b) { const i = document.querySelector(a), f = document.querySelector(b); if (!i || !f) return; i.addEventListener("error", () => { i.style.display = "none"; f.style.display = "block"; }); }
    enableImageFallback(".char--user .char__img", ".char__imgFallback--user");
    enableImageFallback(".char--phisher .char__img", ".char__imgFallback--phisher");
    render();
})();
