// server.ts
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = 3e3;
app.use(express.json());
app.use(express.static(path.resolve(__dirname, "public")));
var presences = /* @__PURE__ */ new Map();
var secretVotesRound1 = [];
var secretVotesRound2 = [];
var electionState = {
  status: "waiting",
  urnaOpen: false,
  currentRound: 1,
  activePresentation: null,
  activeCandidates: ["91", "92", "93"],
  totalConnected: 0,
  totalVotesRound1: 0,
  totalVotesRound2: 0
};
var cachedResults = null;
var sseClients = /* @__PURE__ */ new Set();
function broadcastState() {
  const now = Date.now();
  for (const [id, p] of presences.entries()) {
    if (now - p.lastPing > 9e4) {
      presences.delete(id);
    }
  }
  electionState.totalConnected = presences.size;
  electionState.totalVotesRound1 = secretVotesRound1.length;
  electionState.totalVotesRound2 = secretVotesRound2.length;
  const payload = JSON.stringify({
    electionState,
    results: cachedResults
  });
  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}

`);
    } catch {
      sseClients.delete(client);
    }
  }
}
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(": ping\n\n");
    } catch {
      sseClients.delete(client);
    }
  }
}, 15e3);
app.get("/api/events", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });
  res.write("\n");
  sseClients.add(res);
  const payload = JSON.stringify({
    electionState,
    results: cachedResults
  });
  res.write(`data: ${payload}

`);
  req.on("close", () => {
    sseClients.delete(res);
  });
});
app.get("/api/status", (req, res) => {
  const deviceId = req.query.deviceId;
  let hasVotedInRound = false;
  if (deviceId && presences.has(deviceId)) {
    const student = presences.get(deviceId);
    student.lastPing = Date.now();
    hasVotedInRound = electionState.currentRound === 1 ? student.votedRound1 : student.votedRound2;
  }
  electionState.totalConnected = presences.size;
  electionState.totalVotesRound1 = secretVotesRound1.length;
  electionState.totalVotesRound2 = secretVotesRound2.length;
  res.json({
    electionState: {
      ...electionState,
      hasVotedInRound
    },
    results: cachedResults
  });
});
app.post("/api/join", (req, res) => {
  const { deviceId, nickname } = req.body;
  if (!deviceId || !nickname) {
    res.status(400).json({ error: "deviceId e nickname s\xE3o obrigat\xF3rios." });
    return;
  }
  const existing = presences.get(deviceId);
  if (existing) {
    existing.nickname = nickname;
    existing.lastPing = Date.now();
  } else {
    presences.set(deviceId, {
      deviceId,
      nickname,
      connectedAt: Date.now(),
      lastPing: Date.now(),
      votedRound1: false,
      votedRound2: false
    });
  }
  broadcastState();
  res.json({ success: true, nickname });
});
app.post("/api/vote", (req, res) => {
  const { deviceId, vote } = req.body;
  if (!deviceId || !vote) {
    res.status(400).json({ error: "Dados de voto incompletos." });
    return;
  }
  if (!electionState.urnaOpen) {
    res.status(403).json({ error: "A urna est\xE1 temporariamente travada pelo professor." });
    return;
  }
  let student = presences.get(deviceId);
  if (!student) {
    student = {
      deviceId,
      nickname: "Estudante",
      connectedAt: Date.now(),
      lastPing: Date.now(),
      votedRound1: false,
      votedRound2: false
    };
    presences.set(deviceId, student);
  }
  const currentRound = electionState.currentRound;
  if (currentRound === 1 && student.votedRound1) {
    res.status(400).json({ error: "Voc\xEA j\xE1 votou no 1\xBA turno." });
    return;
  }
  if (currentRound === 2 && student.votedRound2) {
    res.status(400).json({ error: "Voc\xEA j\xE1 votou no 2\xBA turno." });
    return;
  }
  if (currentRound === 1) {
    student.votedRound1 = true;
  } else {
    student.votedRound2 = true;
  }
  const targetList = currentRound === 1 ? secretVotesRound1 : secretVotesRound2;
  targetList.push({
    candidateNumber: String(vote),
    round: currentRound,
    recordedAt: Date.now()
  });
  broadcastState();
  res.json({ success: true, message: "Voto registrado com sigilo absoluto!" });
});
app.post("/api/admin/toggle-urna", (req, res) => {
  const { open } = req.body;
  electionState.urnaOpen = Boolean(open);
  if (electionState.urnaOpen) {
    electionState.status = "voting";
  }
  broadcastState();
  res.json({ success: true, urnaOpen: electionState.urnaOpen });
});
app.post("/api/admin/present", (req, res) => {
  const { candidateId } = req.body;
  electionState.activePresentation = candidateId || null;
  broadcastState();
  res.json({ success: true, activePresentation: electionState.activePresentation });
});
app.post("/api/admin/tally", (_req, res) => {
  electionState.urnaOpen = false;
  electionState.status = "finished";
  const round = electionState.currentRound;
  const votes = round === 1 ? secretVotesRound1 : secretVotesRound2;
  const totalVotes = votes.length;
  let blankCount = 0;
  let nullCount = 0;
  const candidateCounts = {};
  for (const cId of electionState.activeCandidates) {
    candidateCounts[cId] = 0;
  }
  for (const v of votes) {
    if (v.candidateNumber === "branco") {
      blankCount++;
    } else if (v.candidateNumber === "nulo" || !electionState.activeCandidates.includes(v.candidateNumber)) {
      nullCount++;
    } else {
      candidateCounts[v.candidateNumber] = (candidateCounts[v.candidateNumber] || 0) + 1;
    }
  }
  const validVotes = totalVotes - blankCount - nullCount;
  const candidateNames = {
    "91": { name: "Clara Nogueira", focus: "Transporte P\xFAblico" },
    "92": { name: "Samuel Oliveira", focus: "Sa\xFAde B\xE1sica" },
    "93": { name: "Osvaldo Ribeiro", focus: "Creches e Bairros" }
  };
  const candidateResults = {};
  for (const cId of electionState.activeCandidates) {
    const cVotes = candidateCounts[cId] || 0;
    const percentValid = validVotes > 0 ? Number((cVotes / validVotes * 100).toFixed(1)) : 0;
    const percentTotal = totalVotes > 0 ? Number((cVotes / totalVotes * 100).toFixed(1)) : 0;
    candidateResults[cId] = {
      number: cId,
      name: candidateNames[cId]?.name || `Candidato ${cId}`,
      focus: candidateNames[cId]?.focus || "",
      votes: cVotes,
      percentValid,
      percentTotal
    };
  }
  const sorted = Object.values(candidateResults).sort((a, b) => b.votes - a.votes);
  let winnerId = null;
  let needsSecondRound = false;
  let secondRoundCandidates = void 0;
  let tieDetected = false;
  let tieCandidates = [];
  if (round === 1) {
    const top1 = sorted[0];
    const top2 = sorted[1];
    const top3 = sorted[2];
    if (top1 && top1.votes > validVotes / 2 && validVotes > 0) {
      winnerId = top1.number;
      needsSecondRound = false;
    } else {
      needsSecondRound = true;
      if (top2 && top3 && top2.votes === top3.votes && top2.votes > 0) {
        tieDetected = true;
        tieCandidates = [top2.number, top3.number];
        secondRoundCandidates = [top1.number, top2.number];
      } else if (top1 && top2) {
        secondRoundCandidates = [top1.number, top2.number];
      }
    }
  } else {
    const top1 = sorted[0];
    if (top1 && top1.votes > 0) {
      winnerId = top1.number;
    }
  }
  cachedResults = {
    round,
    totalVotes,
    validVotes,
    candidates: candidateResults,
    blankVotes: {
      votes: blankCount,
      percentTotal: totalVotes > 0 ? Number((blankCount / totalVotes * 100).toFixed(1)) : 0
    },
    nullVotes: {
      votes: nullCount,
      percentTotal: totalVotes > 0 ? Number((nullCount / totalVotes * 100).toFixed(1)) : 0
    },
    connectedStudents: presences.size,
    abstentions: Math.max(0, presences.size - totalVotes),
    winnerId,
    needsSecondRound,
    secondRoundCandidates,
    tieDetected,
    tieCandidates
  };
  broadcastState();
  res.json({ success: true, results: cachedResults });
});
app.post("/api/admin/second-round", (req, res) => {
  const { candidates } = req.body;
  if (!candidates || !Array.isArray(candidates) || candidates.length !== 2) {
    res.status(400).json({ error: "\xC9 necess\xE1rio informar exatamente os 2 candidatos finalistas." });
    return;
  }
  electionState.currentRound = 2;
  electionState.activeCandidates = candidates;
  electionState.urnaOpen = true;
  electionState.status = "voting";
  electionState.activePresentation = null;
  cachedResults = null;
  secretVotesRound2.length = 0;
  for (const student of presences.values()) {
    student.votedRound2 = false;
  }
  broadcastState();
  res.json({ success: true, electionState });
});
app.post("/api/admin/reset", (_req, res) => {
  secretVotesRound1.length = 0;
  secretVotesRound2.length = 0;
  cachedResults = null;
  electionState = {
    status: "waiting",
    urnaOpen: false,
    currentRound: 1,
    activePresentation: null,
    activeCandidates: ["91", "92", "93"],
    totalConnected: presences.size,
    totalVotesRound1: 0,
    totalVotesRound2: 0
  };
  for (const student of presences.values()) {
    student.votedRound1 = false;
    student.votedRound2 = false;
  }
  broadcastState();
  res.json({ success: true, message: "Elei\xE7\xE3o reiniciada com sucesso." });
});
async function startServer() {
  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (_req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
      });
    }
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Elei\xE7\xE3o Vila Esperan\xE7a rodando em http://localhost:${PORT}`);
  });
}
startServer();
