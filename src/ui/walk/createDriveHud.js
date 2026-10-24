import "./driveHud.css";

export function createDriveHud({ carController }) {
  const root = document.createElement("div");
  root.className = "drive-hud-root";

  root.innerHTML = `
    <!-- Walk Mode: [F] Drive Car Badge - Only visible when near car -->
    <div class="drive-walk-badge" id="hud-walk-drive-btn" title="Press F to drive car">
      <span class="drive-key-pill">F</span>
      <span class="drive-badge-text">ENTER CAR</span>
    </div>

    <!-- Drive Mode: Exit Button -->
    <div class="drive-exit-badge" id="hud-drive-exit-btn" title="Press F to exit car">
      <span class="drive-exit-pill">F</span>
      <span class="drive-badge-text">EXIT CAR (WALK)</span>
    </div>

    <!-- Drive Mode: Speedometer -->
    <div class="drive-speedometer" id="hud-speedometer" style="display: none;">
      <div class="speedo-main">
        <span class="speedo-number" id="speedo-num">0</span>
        <span class="speedo-unit">KM/H</span>
        <span class="speedo-gear" id="speedo-gear">N</span>
      </div>
      <div class="speedo-bar-track">
        <div class="speedo-bar-fill" id="speedo-bar"></div>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  const walkDriveBtn = root.querySelector("#hud-walk-drive-btn");
  const exitBtn = root.querySelector("#hud-drive-exit-btn");
  const speedometer = root.querySelector("#hud-speedometer");
  const speedoNum = root.querySelector("#speedo-num");
  const speedoGear = root.querySelector("#speedo-gear");
  const speedoBar = root.querySelector("#speedo-bar");

  walkDriveBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    carController.enterCar();
  });

  exitBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    carController.exitCar();
  });

  function update() {
    const isDriving = carController.isDriving();

    if (isDriving) {
      walkDriveBtn.style.display = "none";
      exitBtn.style.display = "flex";
      speedometer.style.display = "flex";

      const kmh = carController.getSpeedKmh();
      const gear = carController.getGear();

      speedoNum.textContent = kmh;
      speedoGear.textContent = gear;
      speedoGear.className = gear === "R" ? "speedo-gear gear-r" : "speedo-gear";

      const barPct = Math.min(100, (kmh / 150) * 100);
      speedoBar.style.width = `${barPct}%`;
    } else {
      exitBtn.style.display = "none";
      speedometer.style.display = "none";

      // Show enter prompt ONLY when close to the car
      if (carController.isNearCar?.()) {
        walkDriveBtn.style.display = "flex";
      } else {
        walkDriveBtn.style.display = "none";
      }
    }
  }

  function destroy() {
    root.remove();
  }

  return {
    update,
    destroy,
  };
}
