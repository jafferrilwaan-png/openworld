import "./aboutPanel.css";
import { isMobileLayout, onMobileLayoutChange } from "../../platform/deviceLayout.js";
import { SOURCE_CODE_URL } from "../core/externalLinks.js";

const CLOSE_ICON = `
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M18 6L6 18M6 6L18 18"
      stroke="currentColor"
      stroke-width="2.25"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
`;

export function createAboutPanel({ state } = {}) {
  const root = document.createElement("div");
  root.className = "about-overlay";
  root.hidden = true;
  root.innerHTML = `
    <button type="button" class="close-button-panel" aria-label="Close">
      ${CLOSE_ICON}
    </button>

    <div class="about-content">
      <div class="about-body">
        <div class="about-brand">
          <p class="about-brand-title">OPENWORLD 3D</p>
          <small class="about-brand-subtitle">BY JAFFER RILWAAN</small>
        </div>
        <div class="about-copy">
          <div class="about-copy-col">
            <p class="about-lead">
              OpenWorld 3D drops you into a rain-soaked cyber metropolis — drive custom
              vehicles, explore illuminated neon streets, and navigate a living futuristic city.
            </p>
            <p class="about-lead">
              Every reflection, droplet, and glow you see is rendered live with Three.js
              WebGPU and TSL — real-time shaders, responsive Rapier 3D vehicle physics, and cinematic bullet-time slow motion.
            </p>
          </div>
          <div class="about-copy-col">
            <p class="about-lead">
              Featuring interactive POAP kiosks, Tanglish storefront banners, and an authentic
              Free Fire style garage loading experience.
            </p>
            <p class="about-lead">
              Hold the right mouse button anytime to trigger Bullet Time slow motion and experience
              the city in high-intensity cinematic detail.
            </p>
          </div>
        </div>
      </div>

      <div class="about-footer">
        <div class="about-buttons">
          <button type="button" class="refresh-button-panel about-link-source">
            GitHub Repository
          </button>
        </div>
        <p class="about-model-credits">
          Developed by Jaffer Rilwaan
        </p>
        <p class="about-recommended about-recommended--desktop">
          <span class="about-recommended-title">Recommended setup</span>
          PC with discrete GPU, 16 GB RAM recommended.
          Chrome or Edge (latest) · WebGPU required · 1080p fullscreen.
          WASD to drive/walk · Right-click for Slow-Mo · Space for handbrake.
        </p>
        <p class="about-recommended about-recommended--mobile">
          <span class="about-recommended-title">Recommended setup</span>
          Mobile devices with WebGPU support · landscape orientation recommended.
        </p>
      </div>
    </div>
  `;

  const closeButton = root.querySelector(".close-button-panel");
  const sourceButton = root.querySelector(".about-link-source");
  const desktopRecommended = root.querySelector(".about-recommended--desktop");
  const mobileRecommended = root.querySelector(".about-recommended--mobile");

  function syncRecommendedVisibility() {
    const mobile = isMobileLayout();
    desktopRecommended.hidden = mobile;
    mobileRecommended.hidden = !mobile;
  }

  syncRecommendedVisibility();
  const unsubscribeLayout = onMobileLayoutChange(syncRecommendedVisibility);

  function open() {
    root.classList.remove("about-overlay--force-hidden");
    syncRecommendedVisibility();
    root.hidden = false;
  }

  function close() {
    root.hidden = true;
    state?.closePanel();
  }

  closeButton.addEventListener("click", close);

  sourceButton.addEventListener("click", () => {
    window.open(SOURCE_CODE_URL, "_blank", "noopener,noreferrer");
  });

  function onKeyDown(event) {
    if (event.key === "Escape" && !root.hidden) {
      close();
    }
  }

  document.addEventListener("keydown", onKeyDown);

  state?.subscribe(({ openedPanel }) => {
    if (openedPanel === "about") {
      open();
    } else if (!root.hidden) {
      root.hidden = true;
    }
  });

  function setForceHidden(force) {
    if (force && !root.hidden) {
      root.classList.toggle("about-overlay--force-hidden", force);
    } else if (!force) {
      root.classList.toggle("about-overlay--force-hidden", false);
    }
  }

  document.body.appendChild(root);

  return {
    root,
    open,
    close,
    setForceHidden,
    destroy() {
      unsubscribeLayout?.();
      document.removeEventListener("keydown", onKeyDown);
      root.remove();
    },
  };
}
