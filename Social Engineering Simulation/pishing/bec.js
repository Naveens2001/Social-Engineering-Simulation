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
                id: "scene1", label: "Scene 1 – Urgent Email", steps: [
                    { speaker: "user", text: "I just got an email directly from the CEO.\nIt says: \"I need you to urgently transfer funds for a confidential project. Do not discuss this with anyone.\"", center: { view: "email" }, effect: "glitch" },
                    { speaker: "phisher", text: "This email looks like it came from the CEO.\nBut it's a fake. The \"From\" address has been slightly altered to deceive the eye.", center: { view: "email", spotlight: "sender" } },
                ]
            },
            {
                id: "scene2", label: "Scene 2 – The Pressure", steps: [
                    { speaker: "user", text: "It's highly confidential and urgent. I don't want to hold up the CEO's project…", center: { view: "transfer" } },
                    { speaker: "phisher", text: "Attackers exploit authority and urgency.\nI'm counting on the employee wanting to please the boss and acting fast without double-checking.", center: { view: "transfer", highlight: true }, effect: "glitch" },
                    { speaker: "phisher", text: "This is Business Email Compromise.\nTargeting employees who have access to finances or sensitive data.", center: { view: "explain" } },
                ]
            },
            {
                id: "scene3", label: "Scene 3 – Consequence", steps: [
                    { speaker: "phisher", text: "If the employee sends the money...", center: { view: "consequences" }, effect: "glitch" },
                    { speaker: "phisher", text: "The funds go directly to an offshore account controlled by attackers.\nThe money is gone before anyone realizes the CEO never sent that email.", center: { view: "consequences", expanded: true }, effect: "glitch" },
                ]
            },
            {
                id: "scene4", label: "Scene 4 – Lesson", steps: [
                    { speaker: "user", text: "How should I handle requests from executives?", center: { view: "lesson" }, effect: "safePulse" },
                    { speaker: "user", text: "Always verify financial requests through another communication channel, like a phone call or a new internal chat message.", center: { view: "lesson", checklist: true }, effect: "safePulse" },
                    { speaker: "user", text: "No executive will fault you for following security protocols.\nVerify first, transfer later.", center: { view: "ending" } },
                ]
            },
        ]
    };

    const state = { sceneId: "scene1", stepIndex: 0, typing: { active: false, target: null, fullText: "", index: 0, timer: null } };
    const runtime = {
        transfer: {
            authorized: false,
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

    function renderEmail(c) {
        const fromStyle = c.spotlight === "sender" ? 'color:rgba(255,45,85,0.95);border:1px dashed rgba(255,45,85,0.95);box-shadow:inset 0 0 10px rgba(255,45,85,0.2);background:rgba(255,45,85,0.1);padding:2px 4px;border-radius:4px;' : 'color:var(--muted);';
        ui.center.innerHTML = `<div class="card"><div class="card__hdr"><span class="pill">✉ Inbox</span><div class="monoSmall">Office Email</div></div><div class="dashboard"><div style="background:rgba(0,0,0,0.3);border:1px solid rgba(217,255,233,0.15);border-radius:16px;padding:16px;max-width:380px;"><div style="font-size:12px;margin-bottom:12px;"><span style="color:#fff;"><strong>From:</strong> CEO Name</span> &lt;<span style="${fromStyle}">ceo@c0mpany-inc.com</span>&gt;<br><span style="color:#fff;"><strong>Subject:</strong> URGENT: Confidential Project ACQUISITION</span></div><div style="font-size:14px;line-height:1.5;color:rgba(255,255,255,0.95);padding-top:12px;border-top:1px solid rgba(255,255,255,0.1);">I need you to urgently transfer $50,000 for a confidential project.<br><br>Do not discuss this with anyone. The acquisition details are highly sensitive. Please process the attached wire instructions immediately.<br><br>Sent from my iPhone</div></div></div></div>`;
        ui.hint.textContent = c.spotlight === "sender" ? "A classic typo-squatting domain: c0mpany-inc vs company-inc." : "The CEO needs a favor, fast.";
    }

    function renderTransfer(c) {
        const extra = c.highlight ? '<div class="callout callout--danger" style="margin-top:15px;"><strong>Social Engineering:</strong> The attacker relies on you bypassing policy out of fear or respect for authority.</div>' : '';
        ui.center.innerHTML = `<div class="card becTransferCard" id="becTransferCard"><div class="card__hdr"><span class="pill" style="border-color:rgba(255,204,0,0.4);color:rgba(255,204,0,0.95);">🏦 Payment Portal</span></div><div class="dashboard" style="text-align:center;"><div style="font-size:42px;margin:20px 0;">💸</div><div class="balance">Pending Transfer</div><div class="balanceSub">Amount: $50,000.00 USD</div><button type="button" class="btn btn--primary js-authorize-transfer" id="authorizeTransferBtn" style="margin-top:20px;width:100%;max-width:200px;">AUTHORIZE TRANSFER</button><div class="callout callout--danger" id="becTransferStatus" hidden style="margin-top:12px;"><strong>Transfer Sent — Funds Compromised</strong></div>${extra}</div></div>`;
        ui.hint.textContent = "It takes courage to question the boss.";
    }

    function renderExplain() {
        ui.center.innerHTML = `<div class="card"><div class="card__hdr"><span class="pill">📖 What is BEC?</span></div><div class="lesson"><div class="callout callout--danger"><strong>Business Email Compromise (BEC)</strong> is a type of scam targeting companies who conduct wire transfers or have suppliers abroad.</div><div class="callout"><strong>The Tactics:</strong><br>• Executive impersonation (CEO/CFO Fraud)<br>• Manipulated email domains (typosquatting)<br>• Exploiting urgency, secrecy, and authority<br>• Bypassing multi-person approval protocols</div></div></div>`;
        ui.hint.textContent = "BEC doesn't need complex malware — it just manipulates human relationships.";
    }

    function renderConsequences(c) {
        const items = [["📉", "Massive financial loss", "Funds wired abroad are extremely hard to recover"], ["👔", "Reputation damage", "Loss of trust from the board and clients"], ["💼", "Career impact", "Employees who bypass protocols face severe disciplinary action"]];
        ui.center.innerHTML = `<div class="card"><div class="card__hdr"><span class="pill" style="border-color:rgba(255,45,85,0.4);color:rgba(255,45,85,0.95);">💀 Consequences</span></div><div class="dashboard"><div class="activity">${items.map(i => `<div class="activityRow"><div class="activityRow__left"><div class="activityRow__title">${i[0]} ${i[1]}</div><div class="activityRow__meta">${i[2]}</div></div><div class="delta delta--out">RISK</div></div>`).join("")}</div>${c?.expanded ? '<div class="callout callout--danger" style="margin-top:10px;"><strong>The money is gone instantly through wire routing.</strong></div>' : ''}</div></div>`;
    }

    function renderLesson(c) {
        ui.center.innerHTML = `<div class="card"><div class="card__hdr"><span class="pill">🛡 Defenses</span></div><div class="lesson"><div class="callout callout--good"><strong>BEC defense:</strong> Establish and follow out-of-band verification policies.</div>${c?.checklist ? '<div class="card" style="border-color:rgba(217,255,233,0.12);"><div class="card__hdr"><span class="pill">Defensive actions</span></div><div class="lesson" style="padding-top:10px;"><ul class="list"><li>Verify financial requests through another communication channel (phone, internal chat)</li><li>Carefully inspect sender domains for slight spelling errors</li><li>Enforce multi-factor authentication for email access</li><li>Implement strict dual-approval processes for wire transfers</li></ul></div></div>' : ''}</div></div>`;
    }

    function renderEnding() {
        try { const l = JSON.parse(localStorage.getItem("cyberLevels") || "{}"); l.level7 = true; localStorage.setItem("cyberLevels", JSON.stringify(l)); } catch (e) { }
        try { localStorage.setItem("bec_complete", "true"); } catch (e) { }
        levelComplete();
        ui.center.innerHTML = `<div class="card"><div class="card__hdr"><span class="pill">✅ Level 7 Complete</span></div><div class="lesson"><div class="callout callout--good"><strong>Final message:</strong><br>Always verify financial requests through another communication channel. Verify first, transfer later.</div><div class="callout">Return to the menu to continue.</div></div></div>`;
        ui.hint.textContent = "✔ Level 7 Complete — Business Email Compromise.";
    }

    function renderCenter(step) {
        const c = step.center || {};
        if (c.view === "email") return renderEmail(c);
        if (c.view === "transfer") return renderTransfer(c);
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
        ui.continueBtn.textContent = state.typing.active ? "Skip" : "Continue";
        if (state.typing.active) {
            ui.continueBtn.disabled = false;
            return;
        }

        const isAuthorizeStep = state.sceneId === "scene2" && state.stepIndex === 0;
        if (isAuthorizeStep && !runtime.transfer.authorized) {
            ui.continueBtn.disabled = true;
            return;
        }

        ui.continueBtn.disabled = false;
    }

    function render() {
        const step = getStep(), scene = getScene(state.sceneId);
        ui.sceneLabel.textContent = scene.label; ui.panelTitle.textContent = scene.label.toUpperCase();
        ui.panelMeta.textContent = `Step ${state.stepIndex + 1}/${scene.steps.length}`;
        if (step.effect === "glitch") setEffect("glitch"); else if (step.effect === "safePulse") setEffect("safePulse"); else setEffect("none");
        renderCenter(step); renderBubbles(step); updateContinue();
        const isAuthorizeStep = state.sceneId === "scene2" && state.stepIndex === 0;
        if (!isAuthorizeStep) runtime.transfer.authorized = false;
    }

    function levelComplete() {
        if (ui.continueBtn) ui.continueBtn.style.display = "none";
        if (ui.homeBtn) ui.homeBtn.style.display = "inline-block";
    }

    ui.continueBtn.addEventListener("click", () => { if (state.typing.active) { finishTyping(); return; } nextStep(); });
    ui.restartBtn.addEventListener("click", () => { clearTyping(); runtime.transfer.authorized = false; state.sceneId = "scene1"; state.stepIndex = 0; render(); });
    if (ui.homeBtn) ui.homeBtn.addEventListener("click", () => { window.location.href = "index.html"; });
    window.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); ui.continueBtn.click(); } });

    // AUTHORIZE TRANSFER interaction (event delegation)
    ui.center.addEventListener("click", (e) => {
        const btn = e.target.closest("#authorizeTransferBtn");
        if (!btn || btn.disabled) return;
        if (!(state.sceneId === "scene2" && state.stepIndex === 0)) return;
        e.preventDefault();

        runtime.transfer.authorized = true;
        btn.disabled = true;

        const card = document.getElementById("becTransferCard");
        const status = document.getElementById("becTransferStatus");
        if (status) status.removeAttribute("hidden");
        if (card) {
            card.classList.remove("bec-compromisedFlash");
            // restart animation reliably
            void card.offsetWidth;
            card.classList.add("bec-compromisedFlash");
        }
        ui.continueBtn.disabled = false;
    });

    function enableImageFallback(a, b) { const i = document.querySelector(a), f = document.querySelector(b); if (!i || !f) return; i.addEventListener("error", () => { i.style.display = "none"; f.style.display = "block"; }); }
    enableImageFallback(".char--user .char__img", ".char__imgFallback--user");
    enableImageFallback(".char--phisher .char__img", ".char__imgFallback--phisher");
    render();
})();
