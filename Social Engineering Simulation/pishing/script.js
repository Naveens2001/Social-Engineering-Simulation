/* =========================================================
   Don’t Get Hooked — Vanilla JS story engine
   - Scene-based state management
   - Dialogue stored in a structured object
   - Reusable UI renderers (characters, bubbles, choices, center panel)
   - Typing animation + skip
   ========================================================= */

(() => {
  "use strict";

  const $ = (sel) => /** @type {HTMLElement} */(document.querySelector(sel));

  const appEl = $("#app");
  const ui = {
    sceneLabel: $("#uiSceneLabel"),
    panelTitle: $("#uiPanelTitle"),
    panelMeta: $("#uiPanelMeta"),
    center: $("#uiCenter"),

    userBubble: $("#uiUserBubble"),
    phisherBubble: $("#uiPhisherBubble"),
    userText: $("#uiUserText"),
    phisherText: $("#uiPhisherText"),

    hint: $("#uiHint"),
    choices: $("#uiChoices"),
    continueBtn: $("#uiContinueBtn"),
    restartBtn: $("#uiRestartBtn"),

    modal: /** @type {HTMLDialogElement} */ ($("#uiModal")),
    modalTitle: $("#uiModalTitle"),
    modalBody: $("#uiModalBody"),
    modalCloseBtn: $("#uiModalCloseBtn"),
  };

  // -----------------------------
  // Story data (structured + extendable)
  // -----------------------------

  const BANK = {
    name: "NorthRiver Bank",
    legitDomain: "northriverbank.com",
    phishDomain: "northriverbànk-secure.com", // looks similar; not the real domain
  };

  /**
   * Step schema:
   * - speaker: "user" | "phisher"
   * - text: string
   * - center: { view: "email"|"login"|"dashboard"|"lesson"|"ending", ... }
   * - effect: "none" | "glitch" | "safePulse"
   * - gate: { type: "none" | "loginSubmit" }
   * - next?: { sceneId: string, stepIndex: number }  // optional jump on Continue
   * - choices?: [{ id, label, tone, onChoose }]
   */
  const STORY = {
    scenes: [
      {
        id: "scene1",
        label: "Scene 1 – The Hook",
        steps: [
          {
            speaker: "user",
            text: "Morning routine. Coffee. Inbox.",
            center: { view: "email" },
          },
          {
            speaker: "phisher",
            text:
              "“Your account will be locked unless you act immediately!”\n\nClick the link in the email. Right now.",
            center: { view: "email", spotlight: "cta" },
          },
          {
            speaker: "user",
            text:
              "The email looks… professional. Logo. Colors. No typos.\nThere’s a link labeled “Click here to verify your account.”",
            center: { view: "email", spotlight: "link" },
          },
          {
            speaker: "user",
            text:
              "This feels urgent.\nWhat do I do?",
            center: { view: "email", spotlight: "choice" },
            choices: [
              {
                id: "click",
                label: "Click the link (bad choice)",
                tone: "bad",
                onChoose: (s) => {
                  s.branch = "compromised";
                  s.simulation = false;
                  jumpTo("scene2", 0);
                },
              },
              {
                id: "verify",
                label: "Pause and verify (good choice)",
                tone: "safe",
                onChoose: (s) => {
                  s.branch = "safe";
                  s.simulation = true; // we will still demonstrate scenes 2–3 safely as a simulation
                  jumpTo("scene1", 4);
                },
              },
            ],
          },
          {
            speaker: "user",
            text:
              "I pause.\nI check the sender.\nI hover the link.\nThe URL doesn’t match the bank’s official domain.\n\nI won’t click it for real.\nBut I’ll run a safe simulation to see the trap.",
            center: { view: "email", spotlight: "link" },
            effect: "safePulse",
            next: { sceneId: "scene2", stepIndex: 0 },
          },
        ],
      },

      {
        id: "scene2",
        label: "Scene 2 – The Trap",
        steps: [
          {
            speaker: "user",
            text:
              "I click the link…\nAnd it opens a page that looks exactly like my bank’s login screen.",
            center: { view: "login" },
          },
          {
            speaker: "user",
            text: "It asks for my Username and Password.",
            center: { view: "login", spotlight: "fields" },
          },
          {
            speaker: "user",
            text:
              "Fine. I’ll enter them quickly…",
            center: { view: "login", spotlight: "submit" },
            gate: { type: "loginSubmit" },
          },
          {
            speaker: "phisher",
            text:
              "Got it.\nCredentials captured.\nThanks for walking them right into my net.",
            center: { view: "login", reveal: true },
            effect: "glitch",
          },
          {
            speaker: "user",
            text:
              "Wait—this isn’t the real bank website.\nThe address bar is wrong. The lock icon means nothing if the domain is fake.",
            center: { view: "login", reveal: true },
          },
        ],
      },

      {
        id: "scene3",
        label: "Scene 3 – The Consequence",
        steps: [
          {
            speaker: "phisher",
            text:
              "Now I use your credentials on the real bank site.\nNo alarms. No drama. Just access.",
            center: { view: "dashboard" },
            effect: "glitch",
          },
          {
            speaker: "phisher",
            text:
              "Money can be transferred.\nAccounts can be locked.\nAnd with enough details? Identity theft.",
            center: { view: "dashboard", action: "transfer" },
            effect: "glitch",
          },
          {
            speaker: "user",
            text:
              "I’m watching my balance drop.\nMy account can be frozen.\nMy identity can be used like a spare key.",
            center: { view: "dashboard", action: "lock" },
            effect: "glitch",
          },
          {
            speaker: "user",
            text: "All of this happened because of one click.",
            center: { view: "dashboard", action: "summary" },
          },
        ],
      },

      {
        id: "scene4",
        label: "Scene 4 – The Lesson",
        steps: [
          {
            speaker: "user",
            text:
              "That was a phishing attack.\nIt wasn’t about spelling mistakes. It was about urgency… and fake trust.",
            center: { view: "lesson" },
            effect: "safePulse",
          },
          {
            speaker: "phisher",
            text:
              "I don’t need to break your bank.\nI just need you to believe me for 10 seconds.",
            center: { view: "lesson" },
          },
          {
            speaker: "user",
            text:
              "Next time:\n- Pause before clicking\n- Check the sender email carefully\n- Hover over links to inspect URLs\n- Visit official websites directly",
            center: { view: "lesson", checklist: true },
            effect: "safePulse",
          },
          {
            speaker: "user",
            text:
              "So next time you get an urgent email asking for personal details, remember: it might be bait. Don’t get hooked!",
            center: { view: "ending" },
          },
        ],
      },
    ],
  };

  // -----------------------------
  // State
  // -----------------------------

  const state = {
    sceneId: "scene1",
    stepIndex: 0,

    // Branch outcome set by the player’s choice in Scene 1.
    // - compromised: you clicked without verifying
    // - safe: you paused and verified (we still demo the trap safely as a simulation)
    branch: /** @type {null | "compromised" | "safe"} */ (null),
    simulation: false,

    // “Captured” values (purely local; never sent anywhere).
    capturedUsername: "",
    capturedPassword: "",
    loginGateSatisfied: false,
    loginFormUnlocked: false,

    // Typewriter
    typing: {
      active: false,
      target: /** @type {HTMLElement | null} */ (null),
      fullText: "",
      index: 0,
      timer: /** @type {number | null} */ (null),
    },

    // Center panel “bank account” visual state
    balance: 8420,
    accountLocked: false,
    transferCount: 0,
  };

  // -----------------------------
  // Story helpers
  // -----------------------------

  function getScene(sceneId) {
    const s = STORY.scenes.find((x) => x.id === sceneId);
    if (!s) throw new Error("Unknown scene: " + sceneId);
    return s;
  }

  function getStep() {
    const scene = getScene(state.sceneId);
    const step = scene.steps[state.stepIndex];
    if (!step) throw new Error("Unknown step index: " + state.stepIndex);
    return step;
  }

  function jumpTo(sceneId, stepIndex) {
    state.sceneId = sceneId;
    state.stepIndex = stepIndex;
    // Reset some visual states when entering scenes (keeps extending easier).
    if (sceneId === "scene2" && stepIndex === 0) {
      state.capturedUsername = "";
      state.capturedPassword = "";
      state.loginGateSatisfied = false;
      state.loginFormUnlocked = false;
    }
    if (sceneId === "scene3" && stepIndex === 0) {
      state.balance = 8420;
      state.accountLocked = false;
      state.transferCount = 0;
    }
    render();
  }

  function nextStep() {
    const currentStep = getStep();
    if (currentStep.next) {
      jumpTo(currentStep.next.sceneId, currentStep.next.stepIndex);
      return;
    }

    const scene = getScene(state.sceneId);
    const next = state.stepIndex + 1;
    if (next < scene.steps.length) {
      state.stepIndex = next;
      render();
      return;
    }
    // Auto-advance to next scene if any
    const sceneIdx = STORY.scenes.findIndex((s) => s.id === state.sceneId);
    const nextScene = STORY.scenes[sceneIdx + 1];
    if (nextScene) {
      state.sceneId = nextScene.id;
      state.stepIndex = 0;
      render();
      return;
    }
  }

  // -----------------------------
  // Typewriter
  // -----------------------------

  function clearTyping() {
    if (state.typing.timer != null) {
      window.clearTimeout(state.typing.timer);
    }
    state.typing.active = false;
    state.typing.target = null;
    state.typing.fullText = "";
    state.typing.index = 0;
    state.typing.timer = null;
  }

  function finishTyping() {
    if (!state.typing.active || !state.typing.target) return;
    state.typing.target.textContent = state.typing.fullText;
    // add cursor
    const cursor = document.createElement("span");
    cursor.className = "typeCursor";
    state.typing.target.appendChild(cursor);
    clearTyping();
    // Phishing login form should remain disabled until this dialogue finishes.
    if (state.sceneId === "scene2" && state.stepIndex === 2) {
      state.loginFormUnlocked = true;
      setLoginFormEnabled(true);
    }
    updateContinueAvailability();
  }

  function typeInto(target, fullText) {
    clearTyping();
    state.typing.active = true;
    state.typing.target = target;
    state.typing.fullText = fullText;
    state.typing.index = 0;

    target.textContent = "";

    const tick = () => {
      if (!state.typing.active || !state.typing.target) return;
      const t = state.typing.target;
      const i = state.typing.index;

      if (i >= state.typing.fullText.length) {
        finishTyping();
        return;
      }

      t.textContent += state.typing.fullText.charAt(i);
      state.typing.index += 1;

      // cursor (re-append)
      const cursor = document.createElement("span");
      cursor.className = "typeCursor";
      t.appendChild(cursor);

      const base = 14;
      const jitter = Math.floor(Math.random() * 12);
      state.typing.timer = window.setTimeout(tick, base + jitter);
    };

    state.typing.timer = window.setTimeout(tick, 40);
  }

  // -----------------------------
  // Center panel renderers (reusable components)
  // -----------------------------

  function renderEmail(center) {
    const phishSender = `security@${BANK.phishDomain}`;
    const inspectUrl = `https://${BANK.phishDomain}/verify?session=bank-login`;

    ui.center.innerHTML = `
      <div class="card">
        <div class="card__hdr">
          <div class="pill">Inbox • New message</div>
          <div class="monoSmall">${state.simulation ? "TRAINING SIMULATION" : "LIVE MOMENT"}</div>
        </div>
        <div class="email">
          <div class="email__brandRow">
            <div class="bankLogo" aria-label="Bank brand">
              <div class="bankLogo__mark" aria-hidden="true"></div>
              <div class="bankLogo__name">${BANK.name}</div>
            </div>
            <div class="pill" style="border-color: rgba(18,110,255,0.35); color: rgba(123,247,255,0.95);">
              Customer Support
            </div>
          </div>

          <div class="email__metaGrid" aria-label="Email header">
            <div class="email__metaRow">
              <div class="email__metaKey">From</div>
              <div><strong>${BANK.name}</strong> &lt;<span id="uiSenderAddr">${phishSender}</span>&gt;</div>
            </div>
            <div class="email__metaRow">
              <div class="email__metaKey">Subject</div>
              <div class="email__subject">Action Required: Account Security Alert</div>
            </div>
          </div>

          <div class="email__body">
            <div style="font-weight:900; color: rgba(255,255,255,0.98);">
              “Your account will be locked unless you act immediately!”
            </div>
            <div style="margin-top: 8px;">
              We detected unusual sign-in activity. To avoid an account lock, please verify your account now.
            </div>
            <div class="email__cta">
              <a class="email__link" href="#" id="uiEmailLink" title="Hover to inspect the real URL">
                Click here to verify your account.
              </a>
              <button class="btn btn--ghost" type="button" id="uiInspectBtn">Inspect link</button>
            </div>
            <div class="urlTip" id="uiUrlTip" style="display:none;">
              Hover inspection: <span style="color: rgba(255,204,0,0.95); font-weight:900;">${inspectUrl}</span>
              <div class="monoSmall" style="margin-top:4px;">
                Notice the domain: <strong>${BANK.phishDomain}</strong> (not <strong>${BANK.legitDomain}</strong>)
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Email link = bad choice interaction (the player can literally click the link).
    const link = /** @type {HTMLAnchorElement} */ ($("#uiEmailLink"));
    link.addEventListener("click", (e) => {
      e.preventDefault();
      // Only allow “click the link” when we’re still in the choice moment
      if (state.sceneId === "scene1" && state.branch == null) {
        state.branch = "compromised";
        state.simulation = false;
        jumpTo("scene2", 0);
      }
    });

    // Hover (desktop) reveals the actual URL.
    const urlTip = $("#uiUrlTip");
    link.addEventListener("pointerenter", () => {
      urlTip.style.display = "block";
    });
    link.addEventListener("pointerleave", () => {
      urlTip.style.display = "none";
    });

    // Mobile-friendly inspect button opens a modal.
    const inspectBtn = $("#uiInspectBtn");
    inspectBtn.addEventListener("click", () => {
      openModal(
        "Inspect link",
        `
          <div class="callout">
            <div style="font-weight:900; margin-bottom:6px;">Hover/inspect rule:</div>
            <div>Links can <em>look</em> like your bank — but the real destination is the URL/domain.</div>
          </div>
          <div style="margin-top:10px;">
            <div class="monoSmall">Displayed text:</div>
            <div><strong>Click here to verify your account.</strong></div>
          </div>
          <div style="margin-top:10px;">
            <div class="monoSmall">Actual URL:</div>
            <div style="word-break: break-word;">
              <strong style="color: rgba(255,204,0,0.95);">${inspectUrl}</strong>
            </div>
            <div class="monoSmall" style="margin-top:6px;">
              Real bank domain would be <strong>${BANK.legitDomain}</strong>.
            </div>
          </div>
        `
      );
    });

    // Spotlight states (purely visual; makes extending scenes easy).
    if (center?.spotlight === "cta") {
      ui.hint.textContent = "The phisher is speaking through the email — urgency is the hook.";
    } else if (center?.spotlight === "link") {
      ui.hint.textContent = "Hover (or Inspect) the link to see where it really goes.";
    } else if (center?.spotlight === "choice") {
      ui.hint.textContent = "Your choice changes the outcome.";
    } else {
      ui.hint.textContent = "Tip: If it feels urgent, pause and verify.";
    }
  }

  function renderLogin(center) {
    const url = `https://${BANK.phishDomain}/login`;
    const banner = state.simulation
      ? `<div class="callout callout--good"><strong>Safe path:</strong> You paused and verified. This is a <strong>training simulation</strong> showing what the trap looks like.</div>`
      : `<div class="callout callout--danger"><strong>Compromised path:</strong> You followed the link under pressure.</div>`;

    const reveal = center?.reveal
      ? `<div class="callout callout--danger">
          <strong>Reveal:</strong> This page is not the real bank website.
          The design is copied to steal your login.
        </div>`
      : "";

    ui.center.innerHTML = `
      <div class="card">
        <div class="browserBar">
          <div class="dotRow" aria-hidden="true">
            <span class="dot dot--r"></span>
            <span class="dot dot--y"></span>
            <span class="dot dot--g"></span>
          </div>
          <div class="address" title="${url}">${url}</div>
        </div>
        <div class="login">
          ${banner}
          <div class="login__header">
            <div>
              <div class="login__title">${BANK.name}</div>
              <div class="login__sub">Sign in to Online Banking</div>
            </div>
            <div class="pill" style="border-color: rgba(18,110,255,0.28); color: rgba(123,247,255,0.95);">Secure Login</div>
          </div>

          ${reveal}

          <form id="uiLoginForm" autocomplete="off" novalidate>
            <div class="callout callout--danger" id="uiCredCaptured" hidden>
              <strong>Credentials Captured</strong>
            </div>
            <div class="formRow">
              <label for="uiUsername">Username</label>
              <input id="uiUsername" name="username" inputmode="email" placeholder="e.g. milan123" />
            </div>
            <div class="formRow">
              <label for="uiPassword">Password</label>
              <input id="uiPassword" name="password" type="password" placeholder="••••••••" />
            </div>
            <div class="login__actions">
              <a class="tinyLink" href="#" id="uiForgot">Forgot password?</a>
              <button class="btn btn--primary" type="submit" id="uiLoginSubmit">
                Sign in
              </button>
            </div>
          </form>

          <div class="monoSmall">
            Note: This is a simulated page. Your inputs stay in your browser and are never sent anywhere.
          </div>
        </div>
      </div>
    `;

    const forgot = $("#uiForgot");
    forgot.addEventListener("click", (e) => e.preventDefault());

    const form = /** @type {HTMLFormElement} */ ($("#uiLoginForm"));
    const userEl = /** @type {HTMLInputElement} */ ($("#uiUsername"));
    const passEl = /** @type {HTMLInputElement} */ ($("#uiPassword"));
    const submitEl = /** @type {HTMLButtonElement} */ ($("#uiLoginSubmit"));
    const capturedEl = $("#uiCredCaptured");

    // Focus on the username for a “playable” feel.
    window.setTimeout(() => {
      if (!userEl.disabled) userEl.focus();
    }, 0);

    // Disable login until the "Fine..." dialogue finishes.
    const lockLogin =
      state.sceneId === "scene2" &&
      (state.stepIndex < 2 || (state.stepIndex === 2 && !state.loginFormUnlocked));
    setLoginFormEnabled(!lockLogin);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (userEl.disabled || passEl.disabled || submitEl.disabled) return;

      const u = (userEl.value || "").trim();
      const p = (passEl.value || "").trim();
      if (!u || !p) {
        openModal(
          "Missing info",
          `<div class="callout">To continue the story, enter a Username and Password (any text) — this is a simulation.</div>`
        );
        return;
      }

      state.capturedUsername = u;
      state.capturedPassword = p;

      // Compromise simulation: flash + warning text, then enable Continue.
      const loginPanel = /** @type {HTMLElement | null} */ (ui.center.querySelector(".login"));
      if (loginPanel) {
        loginPanel.classList.remove("is-compromisedFlash");
        void loginPanel.offsetWidth;
        loginPanel.classList.add("is-compromisedFlash");
      }
      if (capturedEl) capturedEl.removeAttribute("hidden");
      state.loginGateSatisfied = true;
      updateContinueAvailability();
    });

    if (center?.spotlight === "fields") {
      ui.hint.textContent = "The page looks real — but what matters is the domain in the address bar.";
    } else if (center?.spotlight === "submit") {
      ui.hint.textContent = "Submitting credentials is what the attacker wants.";
    } else {
      ui.hint.textContent = state.simulation
        ? "Safe path: you’re observing the trap in a simulation."
        : "Compromised path: the trap is already working.";
    }
  }

  function renderDashboard(center) {
    const tag = state.simulation
      ? `<span class="pill">Simulation • Consequence preview</span>`
      : `<span class="pill" style="border-color: rgba(255,45,85,0.3); color: rgba(255,45,85,0.92);">Breach • Live consequences</span>`;

    // small deterministic “drama” without needing a timer loop
    if (center?.action === "transfer" && state.transferCount === 0) {
      state.balance -= 1250;
      state.transferCount += 1;
    }
    if (center?.action === "lock" && !state.accountLocked) {
      state.accountLocked = true;
    }

    ui.center.innerHTML = `
      <div class="card">
        <div class="card__hdr">
          ${tag}
          <div class="monoSmall">${BANK.name} • Online Banking</div>
        </div>
        <div class="dashboard">
          <div class="dashTop">
            <div>
              <div class="balance">Balance: $${state.balance.toLocaleString()}</div>
              <div class="balanceSub">Checking • Ending in 042</div>
            </div>
            <div class="pill" style="border-color: ${state.accountLocked ? "rgba(255,45,85,0.45)" : "rgba(40,255,152,0.35)"
      }; color: ${state.accountLocked ? "rgba(255,45,85,0.95)" : "rgba(40,255,152,0.95)"
      };">
              ${state.accountLocked ? "ACCOUNT LOCKED" : "ACCOUNT ACTIVE"}
            </div>
          </div>

          <div class="activity" aria-label="Recent activity">
            <div class="activityRow">
              <div class="activityRow__left">
                <div class="activityRow__title">Sign-in detected</div>
                <div class="activityRow__meta">New device • Unknown location</div>
              </div>
              <div class="delta delta--out">${state.simulation ? "SIM" : "LIVE"}</div>
            </div>

            <div class="activityRow">
              <div class="activityRow__left">
                <div class="activityRow__title">Transfer</div>
                <div class="activityRow__meta">External account • Fast transfer</div>
              </div>
              <div class="delta ${state.transferCount ? "delta--out" : "delta--ok"}">
                ${state.transferCount ? "-$1,250" : "$0"}
              </div>
            </div>

            <div class="activityRow">
              <div class="activityRow__left">
                <div class="activityRow__title">Security action</div>
                <div class="activityRow__meta">Attempted lock / password reset</div>
              </div>
              <div class="delta ${state.accountLocked ? "delta--out" : "delta--ok"}">
                ${state.accountLocked ? "LOCKED" : "OK"}
              </div>
            </div>
          </div>

          <div class="callout callout--danger">
            <strong>Consequences:</strong>
            Attacker accesses the real bank account. Money can be transferred. Account can be locked. Identity theft risk.
          </div>
        </div>
      </div>
    `;

    ui.hint.textContent = state.simulation
      ? "Safe path: you avoided this outcome in real life — but it’s what one click can enable."
      : "Compromised path: this is the downstream impact of handing over credentials.";
  }

  function renderLesson(center) {
    const routeLine =
      state.branch === "safe"
        ? "Outcome: SAFE (you paused and verified)."
        : state.branch === "compromised"
          ? "Outcome: COMPROMISED (the attacker got credentials)."
          : "Outcome: —";

    ui.center.innerHTML = `
      <div class="card">
        <div class="card__hdr">
          <span class="pill">Lesson • In-story tools</span>
          <div class="monoSmall">${routeLine}</div>
        </div>
        <div class="lesson">
          <div class="callout callout--good">
            <strong>This is phishing:</strong> a fake message + fake website designed to steal sensitive information by pushing urgency and trust.
          </div>

          <div class="card" style="border-color: rgba(217,255,233,0.12);">
            <div class="card__hdr">
              <span class="pill">Defensive actions</span>
              <span class="monoSmall">Do these before you click</span>
            </div>
            <div class="lesson" style="padding-top: 10px;">
              <ul class="list">
                <li>Pause before clicking</li>
                <li>Check sender email carefully</li>
                <li>Hover over links to inspect URLs</li>
                <li>Visit official websites directly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;

    ui.hint.textContent = "Defense is a habit: slow down, verify, then act.";
  }

  function renderEnding() {
    // Mark Level 1 as complete
    try {
      const levels = JSON.parse(localStorage.getItem("cyberLevels") || "{}");
      levels.level1 = true;
      localStorage.setItem("cyberLevels", JSON.stringify(levels));
    } catch (e) { }
    try { localStorage.setItem("phishing_complete", "true"); } catch (e) { }
    levelComplete();

    const isSafe = state.branch === "safe";
    const title = isSafe ? "SAFE ENDING" : "COMPROMISED ENDING";
    const toneClass = isSafe ? "callout--good" : "callout--danger";
    const text = isSafe
      ? "You didn’t hand over real credentials. You paused, inspected, and chose the official path."
      : "The attacker got usable credentials. In the real world, you’d need to change passwords and contact your bank immediately.";

    ui.center.innerHTML = `
      <div class="card">
        <div class="card__hdr">
          <span class="pill">Final • ${title}</span>
          <div class="monoSmall">No tracking • No backend • Runs locally</div>
        </div>
        <div class="lesson">
          <div class="callout ${toneClass}">
            <strong>${title}:</strong> ${text}
          </div>
          <div class="callout">
            Want to replay? Hit <strong>Restart</strong> and try the other choice.
          </div>
        </div>
      </div>
    `;

    ui.hint.textContent = isSafe
      ? "Green = verified and safe."
      : "Red = compromised. Learn the pattern, break the chain.";
  }

  // -----------------------------
  // Modal
  // -----------------------------

  function openModal(title, html) {
    ui.modalTitle.textContent = title;
    ui.modalBody.innerHTML = html;
    if (typeof ui.modal.showModal === "function") ui.modal.showModal();
  }

  function closeModal() {
    if (ui.modal.open) ui.modal.close();
  }

  // -----------------------------
  // UI render
  // -----------------------------

  function setEffect(effect) {
    // Remove transient classes; apply per-step.
    appEl.classList.remove("is-compromised");
    appEl.classList.remove("is-safePulse");

    if (effect === "glitch") {
      appEl.classList.add("is-compromised");
      return;
    }
    if (effect === "safePulse") {
      appEl.classList.add("is-safePulse");
      // Clear the pulse after it runs once.
      window.setTimeout(() => appEl.classList.remove("is-safePulse"), 950);
    }
  }

  function renderBubbles(step) {
    // Show only the active speaker’s bubble with typing.
    const isUser = step.speaker === "user";
    ui.userBubble.style.opacity = isUser ? "1" : "0.5";
    ui.phisherBubble.style.opacity = isUser ? "0.5" : "1";

    // Clear both, then type only into the active one.
    ui.userText.textContent = "";
    ui.phisherText.textContent = "";

    const target = isUser ? ui.userText : ui.phisherText;
    typeInto(target, step.text);
  }

  function clearChoices() {
    ui.choices.innerHTML = "";
  }

  function renderChoices(step) {
    clearChoices();
    if (!step.choices || step.choices.length === 0) return;

    step.choices.forEach((c, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btnChoice";
      if (c.tone === "safe") btn.classList.add("btnChoice--safe");
      if (c.tone === "risk") btn.classList.add("btnChoice--risk");
      if (c.tone === "bad") btn.classList.add("btnChoice--bad");
      btn.textContent = `${idx + 1}. ${c.label}`;
      btn.addEventListener("click", () => {
        c.onChoose(state);
      });
      ui.choices.appendChild(btn);
    });
  }

  function updateContinueAvailability() {
    const step = getStep();
    const hasChoices = Boolean(step.choices && step.choices.length);
    const gated = step.gate?.type === "loginSubmit";

    // While typing, “Continue” acts as “Skip typing”.
    if (state.typing.active) {
      ui.continueBtn.disabled = false;
      ui.continueBtn.textContent = "Skip";
      return;
    }

    // If step has choices, “Continue” should not compete with them.
    if (hasChoices) {
      ui.continueBtn.disabled = true;
      ui.continueBtn.textContent = "Continue";
      return;
    }

    // If gated, disable Continue until the gate event advances the step.
    if (gated) {
      ui.continueBtn.disabled = !state.loginGateSatisfied;
      ui.continueBtn.textContent = "Continue";
      return;
    }

    ui.continueBtn.disabled = false;
    ui.continueBtn.textContent = "Continue";
  }

  function renderCenter(step) {
    const center = step.center || { view: "email" };
    if (center.view === "email") return renderEmail(center);
    if (center.view === "login") return renderLogin(center);
    if (center.view === "dashboard") return renderDashboard(center);
    if (center.view === "lesson") return renderLesson(center);
    if (center.view === "ending") return renderEnding(center);
  }

  function renderTop(step) {
    const scene = getScene(state.sceneId);
    ui.sceneLabel.textContent = scene.label;
    ui.panelTitle.textContent = scene.label.toUpperCase();

    const route =
      state.branch === "safe"
        ? "SAFE ROUTE"
        : state.branch === "compromised"
          ? "COMPROMISED ROUTE"
          : "—";

    const mode = state.simulation ? "SIMULATION" : "LIVE";
    ui.panelMeta.textContent = `Step ${state.stepIndex + 1}/${scene.steps.length} • ${route} • ${mode}`;
  }

  function render() {
    const step = getStep();
    renderTop(step);

    // Effects: compromise glitch is intentionally loud.
    if (state.branch === "compromised" && step.effect === "glitch") {
      setEffect("glitch");
    } else if (step.effect === "safePulse") {
      setEffect("safePulse");
    } else {
      setEffect("none");
    }

    renderCenter(step);
    renderChoices(step);
    renderBubbles(step);
    updateContinueAvailability();
  }

  // -----------------------------
  // Controls & input
  // -----------------------------

  function levelComplete() {
    const continueBtn = ui.continueBtn;
    const homeBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById("uiHomeBtn"));
    if (continueBtn) continueBtn.style.display = "none";
    if (homeBtn) homeBtn.style.display = "inline-block";
  }

  const homeBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById("uiHomeBtn"));
  if (homeBtn) {
    homeBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }

  ui.continueBtn.addEventListener("click", () => {
    if (state.typing.active) {
      finishTyping();
      return;
    }
    nextStep();
  });

  ui.restartBtn.addEventListener("click", () => restart());

  ui.modalCloseBtn.addEventListener("click", () => closeModal());
  ui.modal.addEventListener("click", (e) => {
    // Close when clicking the backdrop (the dialog itself), not the card contents.
    if (e.target === ui.modal) closeModal();
  });

  // Keyboard: Enter continues / skips; 1/2 chooses when choices exist.
  window.addEventListener("keydown", (e) => {
    if (ui.modal.open) return;

    if (e.key === "Enter") {
      e.preventDefault();
      ui.continueBtn.click();
      return;
    }

    const step = getStep();
    if (step.choices && step.choices.length) {
      if (e.key === "1" && step.choices[0]) step.choices[0].onChoose(state);
      if (e.key === "2" && step.choices[1]) step.choices[1].onChoose(state);
    }
  });

  function restart() {
    closeModal();
    clearTyping();
    state.sceneId = "scene1";
    state.stepIndex = 0;
    state.branch = null;
    state.simulation = false;
    state.capturedUsername = "";
    state.capturedPassword = "";
    state.loginGateSatisfied = false;
    state.loginFormUnlocked = false;
    state.balance = 8420;
    state.accountLocked = false;
    state.transferCount = 0;
    render();
  }

  function setLoginFormEnabled(enabled) {
    const userEl = /** @type {HTMLInputElement | null} */ (document.getElementById("uiUsername"));
    const passEl = /** @type {HTMLInputElement | null} */ (document.getElementById("uiPassword"));
    const submitEl = /** @type {HTMLButtonElement | null} */ (document.getElementById("uiLoginSubmit"));
    if (userEl) userEl.disabled = !enabled;
    if (passEl) passEl.disabled = !enabled;
    if (submitEl) submitEl.disabled = !enabled;
  }

  // -----------------------------
  // Image fallback: if local PNGs are missing, show the CSS fallback blocks.
  // -----------------------------

  function enableImageFallback(imgSelector, fallbackSelector) {
    const img = /** @type {HTMLImageElement | null} */ (document.querySelector(imgSelector));
    const fallback = /** @type {HTMLElement | null} */ (document.querySelector(fallbackSelector));
    if (!img || !fallback) return;

    img.addEventListener("error", () => {
      img.style.display = "none";
      fallback.style.display = "block";
    });
  }

  enableImageFallback(".char--user .char__img", ".char__imgFallback--user");
  enableImageFallback(".char--phisher .char__img", ".char__imgFallback--phisher");

  // Start
  render();
})();

