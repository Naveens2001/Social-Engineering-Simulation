(() => {
  "use strict";
  const $ = (sel) => document.querySelector(sel);
  const ui = {
    sceneLabel: $("#uiSceneLabel"), panelTitle: $("#uiPanelTitle"), panelMeta: $("#uiPanelMeta"),
    center: $("#uiCenter"), userBubble: $("#uiUserBubble"), phisherBubble: $("#uiPhisherBubble"),
    userText: $("#uiUserText"), phisherText: $("#uiPhisherText"), hint: $("#uiHint"),
    choices: $("#uiChoices"), continueBtn: $("#uiContinueBtn"), homeBtn: $("#uiHomeBtn"), restartBtn: $("#uiRestartBtn"),
  };

  const STORY = { scenes: [
    { id: "scene1", label: "Scene 1 – Suspicious SMS", steps: [
      { speaker: "user", text: "I just got a text message on my phone.\nIt says it's from my bank…", center: { view: "sms" } },
      { speaker: "user", text: "URGENT: Your bank account is locked.\nVerify immediately: bit.ly/secure-bank\n\nIt looks official… should I click?", center: { view: "sms", spotlight: "link" } },
      { speaker: "phisher", text: "This message looks official, but it's a trap.\nI sent thousands of these — all I need is one person to click.", center: { view: "sms", reveal: true } },
    ]},
    { id: "scene2", label: "Scene 2 – The Link", steps: [
      { speaker: "user", text: "I clicked the link…\nIt opened a page that looks exactly like my bank's login screen.", center: { view: "fakeLogin" }, effect: "glitch" },
      { speaker: "phisher", text: "This is SMISHING — phishing through SMS messages.\n\nThe link leads to a fake login page designed to steal your credentials.", center: { view: "fakeLogin", explain: true }, effect: "glitch" },
      { speaker: "phisher", text: "SMS feels more personal and urgent than email.\nPeople trust texts more — that's why smishing works.", center: { view: "explain" } },
    ]},
    { id: "scene3", label: "Scene 3 – Consequence", steps: [
      { speaker: "phisher", text: "Once the victim enters their credentials on the fake page, the damage begins.", center: { view: "consequences" }, effect: "glitch" },
      { speaker: "phisher", text: "Stolen credentials. Financial fraud. Identity theft.\nAll from one text message.", center: { view: "consequences", expanded: true }, effect: "glitch" },
    ]},
    { id: "scene4", label: "Scene 4 – Lesson", steps: [
      { speaker: "user", text: "So how do I protect myself from smishing?", center: { view: "lesson" }, effect: "safePulse" },
      { speaker: "user", text: "Key defenses:\n- Never trust urgent SMS messages\n- Always visit the official website directly\n- Don't click links in unexpected texts\n- Contact your bank through official channels", center: { view: "lesson", checklist: true }, effect: "safePulse" },
      { speaker: "user", text: "Smishing exploits trust and urgency through text messages.\n\nIf a text asks for personal information — it's probably a scam.\nAlways verify directly.", center: { view: "ending" } },
    ]},
  ]};

  const state = { sceneId: "scene1", stepIndex: 0, typing: { active: false, target: null, fullText: "", index: 0, timer: null } };
  const runtime = {
    fakeLogin: {
      submitted: false,
      listenersAttached: false,
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

  function renderSMS(c) {
    let extra = c?.reveal ? '<div class="callout callout--danger" style="margin-top:10px;"><strong>⚠ This is a smishing attempt!</strong> The link leads to a fake website controlled by the attacker.</div>' : "";
    ui.center.innerHTML = `<div class="card"><div class="card__hdr"><span class="pill">📱 Text Message</span><div class="monoSmall">SMS Inbox</div></div><div class="dashboard"><div style="background:rgba(0,0,0,0.3);border:1px solid rgba(217,255,233,0.15);border-radius:16px;padding:16px;max-width:340px;"><div style="font-size:11px;color:var(--muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.1em;">From: +1-800-BANK</div><div style="font-size:14px;line-height:1.55;color:rgba(255,255,255,0.95);"><strong style="color:rgba(255,45,85,0.95);">URGENT:</strong> Your bank account is locked.<br>Verify immediately:<br><span style="color:#37d6ff;text-decoration:underline;">bit.ly/secure-bank</span></div></div>${extra}</div></div>`;
    ui.hint.textContent = c?.spotlight === "link" ? "Shortened URLs hide the real destination." : "An unexpected text from your 'bank' — suspicious?";
  }

  function renderFakeLogin(c) {
    let extra = c?.explain ? '<div class="callout callout--danger" style="margin-top:10px;"><strong>SMISHING</strong> = SMS + Phishing. Attackers send fake texts to trick victims into visiting phishing websites.</div>' : "";
    ui.center.innerHTML = `<div class="card"><div class="browserBar"><div class="dotRow"><span class="dot dot--r"></span><span class="dot dot--y"></span><span class="dot dot--g"></span></div><div class="address">https://secure-bank-verify.fake-domain.com/login</div></div><div class="login" id="fakeLoginPanel"><div class="callout callout--danger"><strong>Fake login page!</strong> The URL is wrong.</div><div class="login__header"><div><div class="login__title">SecureBank Online</div><div class="login__sub">Verify your account</div></div></div><div class="formRow"><label for="usernameInput">Username</label><input id="usernameInput" placeholder="Enter username" autocomplete="off" /></div><div class="formRow"><label for="passwordInput">Password</label><input id="passwordInput" type="password" placeholder="••••••••" autocomplete="off" /></div><div class="callout callout--danger smishing-cred-warning" id="smishingCredWarning" hidden style="margin-top:10px;"><strong>Credentials stolen:</strong> This fake login page captured what you typed and sent it to the attacker.</div>${extra}</div></div>`;
    ui.hint.textContent = "The URL doesn't match your real bank.";
  }

  function renderExplain() {
    ui.center.innerHTML = `<div class="card"><div class="card__hdr"><span class="pill">📖 What is Smishing?</span></div><div class="lesson"><div class="callout callout--danger"><strong>Smishing</strong> (SMS + Phishing) uses text messages to trick people into clicking malicious links or revealing personal information.</div><div class="callout"><strong>Why SMS works for attackers:</strong><br>• SMS feels more personal and urgent<br>• People trust texts from "banks"<br>• Short links hide real destinations<br>• Mobile screens make URL verification harder</div></div></div>`;
    ui.hint.textContent = "Smishing exploits the trust people place in text messages.";
  }

  function renderConsequences(c) {
    const items = [["🔑","Stolen credentials","Login details captured"],["💸","Financial fraud","Unauthorized transactions"],["🪪","Identity theft","Personal info used to impersonate you"]];
    ui.center.innerHTML = `<div class="card"><div class="card__hdr"><span class="pill" style="border-color:rgba(255,45,85,0.4);color:rgba(255,45,85,0.95);">💀 Consequences</span></div><div class="dashboard"><div class="activity">${items.map(i=>`<div class="activityRow"><div class="activityRow__left"><div class="activityRow__title">${i[0]} ${i[1]}</div><div class="activityRow__meta">${i[2]}</div></div><div class="delta delta--out">RISK</div></div>`).join("")}</div>${c?.expanded?'<div class="callout callout--danger" style="margin-top:10px;"><strong>All from one text message.</strong></div>':''}</div></div>`;
  }

  function renderLesson(c) {
    ui.center.innerHTML = `<div class="card"><div class="card__hdr"><span class="pill">🛡 Defenses</span></div><div class="lesson"><div class="callout callout--good"><strong>Smishing defense:</strong> Never act on urgency — verify through official channels.</div>${c?.checklist?'<div class="card" style="border-color:rgba(217,255,233,0.12);"><div class="card__hdr"><span class="pill">Defensive actions</span></div><div class="lesson" style="padding-top:10px;"><ul class="list"><li>Never trust urgent SMS messages</li><li>Always visit the official website directly</li><li>Don\'t click links in unexpected texts</li><li>Contact your bank through official channels</li></ul></div></div>':''}</div></div>`;
  }

  function renderEnding() {
    try { const l = JSON.parse(localStorage.getItem("cyberLevels")||"{}"); l.level3 = true; localStorage.setItem("cyberLevels", JSON.stringify(l)); } catch(e) {}
    try { localStorage.setItem("smishing_complete", "true"); } catch (e) { }
    levelComplete();
    ui.center.innerHTML = `<div class="card"><div class="card__hdr"><span class="pill">✅ Level 3 Complete</span></div><div class="lesson"><div class="callout callout--good"><strong>Final message:</strong><br>Smishing exploits trust and urgency through text messages.<br><br>If a text asks for personal info — it's probably a scam.<br><strong>Always verify directly.</strong></div><div class="callout">Level 3 complete! Return to the menu to continue.</div></div></div>`;
    ui.hint.textContent = "✔ Level 3 Complete — Smishing.";
  }

  function renderCenter(step) {
    const c = step.center || {};
    if (c.view === "sms") return renderSMS(c);
    if (c.view === "fakeLogin") return renderFakeLogin(c);
    if (c.view === "explain") return renderExplain();
    if (c.view === "consequences") return renderConsequences(c);
    if (c.view === "lesson") return renderLesson(c);
    if (c.view === "ending") return renderEnding();
  }

  function setEffect(effect) {
    const a = $("#app"); a.classList.remove("is-compromised","is-safePulse");
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

    // Gate Continue in Scene 2 Step 1 until both inputs are filled.
    const isFakeLoginInteractiveStep = state.sceneId === "scene2" && state.stepIndex === 0;
    if (isFakeLoginInteractiveStep && !runtime.fakeLogin.submitted) {
      const username = document.getElementById("usernameInput");
      const password = document.getElementById("passwordInput");
      ui.continueBtn.disabled = !(username?.value.trim() && password?.value.trim());
      return;
    }

    ui.continueBtn.disabled = false;
  }

  function render() {
    const step = getStep(), scene = getScene(state.sceneId);
    ui.sceneLabel.textContent = scene.label; ui.panelTitle.textContent = scene.label.toUpperCase();
    ui.panelMeta.textContent = `Step ${state.stepIndex+1}/${scene.steps.length}`;
    if (step.effect === "glitch") setEffect("glitch"); else if (step.effect === "safePulse") setEffect("safePulse"); else setEffect("none");
    renderCenter(step); renderBubbles(step); updateContinue();

    const isFakeLoginInteractiveStep = state.sceneId === "scene2" && state.stepIndex === 0;
    if (isFakeLoginInteractiveStep && !runtime.fakeLogin.listenersAttached) {
      attachFakeLoginListeners();
      runtime.fakeLogin.listenersAttached = true;
    }
    if (!isFakeLoginInteractiveStep) {
      runtime.fakeLogin.submitted = false;
      runtime.fakeLogin.listenersAttached = false;
    }
  }

  function showCompromiseAnimation() {
    const app = document.getElementById("app");
    const panel = document.getElementById("fakeLoginPanel");
    if (app) app.classList.add("is-compromised");
    if (panel) panel.classList.add("is-compromisedFlash");
    setTimeout(() => {
      if (panel) panel.classList.remove("is-compromisedFlash");
    }, 900);
  }

  function triggerShadowDialogue(text) {
    const scene = getScene(state.sceneId);
    if (!scene) return;
    // Force the next step to be Shadow's explanation line.
    state.sceneId = "scene2";
    state.stepIndex = 1;
    // Ensure the step text matches the requested explanation.
    const step = getStep();
    if (step && step.speaker === "phisher") step.text = text;
    render();
  }

  function attachFakeLoginListeners() {
    const username = document.getElementById("usernameInput");
    const password = document.getElementById("passwordInput");
    const continueBtn = ui.continueBtn;
    if (!username || !password || !continueBtn) return;

    function checkInputs() {
      if (runtime.fakeLogin.submitted) return;
      if (username.value.trim() !== "" && password.value.trim() !== "") {
        continueBtn.disabled = false;
      } else {
        continueBtn.disabled = true;
      }
    }

    username.addEventListener("input", checkInputs);
    password.addEventListener("input", checkInputs);
    checkInputs();
  }

  ui.continueBtn.addEventListener("click", () => {
    if (state.typing.active) { finishTyping(); return; }

    const isFakeLoginInteractiveStep = state.sceneId === "scene2" && state.stepIndex === 0;
    if (isFakeLoginInteractiveStep && !runtime.fakeLogin.submitted) {
      const username = document.getElementById("usernameInput");
      const password = document.getElementById("passwordInput");
      if (!username || !password) return;
      if (!(username.value.trim() && password.value.trim())) return;

      runtime.fakeLogin.submitted = true;
      ui.continueBtn.disabled = true;
      username.disabled = true;
      password.disabled = true;

      const warning = document.getElementById("smishingCredWarning");
      if (warning) warning.removeAttribute("hidden");

      showCompromiseAnimation();

      setTimeout(() => {
        triggerShadowDialogue(
          "This is SMISHING — phishing through SMS messages.\n\nThe link leads to a fake login page designed to steal your credentials."
        );
      }, 2000);
      return;
    }

    nextStep();
  });

  ui.restartBtn.addEventListener("click", () => {
    clearTyping();
    runtime.fakeLogin.submitted = false;
    runtime.fakeLogin.listenersAttached = false;
    state.sceneId = "scene1";
    state.stepIndex = 0;
    render();
  });
  function levelComplete() {
    if (ui.continueBtn) ui.continueBtn.style.display = "none";
    if (ui.homeBtn) ui.homeBtn.style.display = "inline-block";
  }
  if (ui.homeBtn) ui.homeBtn.addEventListener("click", () => { window.location.href = "index.html"; });
  window.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); ui.continueBtn.click(); } });

  function enableImageFallback(a, b) { const i = document.querySelector(a), f = document.querySelector(b); if (!i||!f) return; i.addEventListener("error", () => { i.style.display = "none"; f.style.display = "block"; }); }
  enableImageFallback(".char--user .char__img", ".char__imgFallback--user");
  enableImageFallback(".char--phisher .char__img", ".char__imgFallback--phisher");
  render();
})();
