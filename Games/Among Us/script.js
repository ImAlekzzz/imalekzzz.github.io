let players = [];
let imposter = null;
let tasksRemaining = 0;

function startGame() {
  const count = parseInt(document.getElementById("playerCount").value);
  if (count < 4 || count > 10) {
    alert("Choose between 4 and 10 players");
    return;
  }

  // Initialize players
  players = [];
  for (let i = 1; i <= count; i++) {
    players.push({ id: i, role: 'crewmate', alive: true, tasksDone: false });
  }

  // Assign one imposter
  const imposterIndex = Math.floor(Math.random() * players.length);
  players[imposterIndex].role = 'imposter';
  imposter = players[imposterIndex];

  tasksRemaining = count - 1; // All crewmates have 1 task
  document.getElementById("setup").classList.add("hidden");
  document.getElementById("gameArea").classList.remove("hidden");

  updateUI();
}

function updateUI() {
  const playerContainer = document.getElementById("players");
  playerContainer.innerHTML = '';

  players.forEach(player => {
    const div = document.createElement("div");
    div.className = "player";
    if (!player.alive) div.classList.add("eliminated");

    div.innerHTML = `
      <strong>Player ${player.id}</strong><br/>
      ${player.alive ? getActionButton(player) : '💀 Eliminated'}
    `;

    playerContainer.appendChild(div);
  });

  const status = document.getElementById("status");
  const aliveCount = players.filter(p => p.alive).length;

  if (!imposter.alive) {
    status.textContent = "🎉 Crewmates Win! The Imposter was caught!";
    disableAll();
  } else if (aliveCount <= 2) {
    status.textContent = "💀 Imposter Wins! Only 1 crewmate left.";
    disableAll();
  } else if (tasksRemaining === 0) {
    status.textContent = "✅ Crewmates Win! All tasks completed!";
    disableAll();
  } else {
    status.textContent = "Game in progress...";
  }
}

function getActionButton(player) {
  if (!player.alive) return '';
  if (player.role === 'imposter') {
    return `<button onclick="eliminate()">Eliminate</button>`;
  } else if (!player.tasksDone) {
    return `<button onclick="completeTask(${player.id})">Do Task</button>`;
  } else {
    return `✅ Task Done`;
  }
}

function completeTask(id) {
  const player = players.find(p => p.id === id);
  if (player && player.alive && player.role === 'crewmate' && !player.tasksDone) {
    player.tasksDone = true;
    tasksRemaining--;
    updateUI();
  }
}

function eliminate() {
  const aliveCrewmates = players.filter(p => p.alive && p.role === 'crewmate');
  if (aliveCrewmates.length === 0) return;
  const target = aliveCrewmates[Math.floor(Math.random() * aliveCrewmates.length)];
  target.alive = false;
  updateUI();
}

function callMeeting() {
  const suspects = players.filter(p => p.alive);
  const votedOut = suspects[Math.floor(Math.random() * suspects.length)];
  votedOut.alive = false;
  updateUI();
}

function disableAll() {
  document.querySelectorAll("button").forEach(btn => btn.disabled = true);
}
