import express, { type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.static(path.resolve(__dirname, 'public')));

// ============================================================================
// ARQUITETURA DE DADOS EM MEMÓRIA & SIGILO DO VOTO
// ============================================================================

interface PresenceRecord {
  deviceId: string;
  nickname: string;
  connectedAt: number;
  lastPing: number;
  votedRound1: boolean;
  votedRound2: boolean;
}

// 1. Coleção de presenças e controle de voto por dispositivo
const presences = new Map<string, PresenceRecord>();

// 2. Coleção SECRETA de votos: apenas o número escolhido e o turno.
// Nenhum identificador, apelido, IP ou vínculo com o aluno é registrado aqui.
interface AnonymousVote {
  candidateNumber: string; // '91' | '92' | '93' | 'branco' | 'nulo'
  round: 1 | 2;
  recordedAt: number;
}
const secretVotesRound1: AnonymousVote[] = [];
const secretVotesRound2: AnonymousVote[] = [];

// Estado Geral da Eleição
let electionState = {
  status: 'waiting' as 'waiting' | 'voting' | 'tallying' | 'finished',
  urnaOpen: false,
  currentRound: 1 as 1 | 2,
  activePresentation: null as string | null,
  activeCandidates: ['91', '92', '93'],
  totalConnected: 0,
  totalVotesRound1: 0,
  totalVotesRound2: 0,
};

let cachedResults: any = null;

// ============================================================================
// SERVER-SENT EVENTS (SSE)
// ============================================================================
const sseClients = new Set<Response>();

function broadcastState() {
  // Limpa conexões inativas (mais de 60 segundos sem ping)
  const now = Date.now();
  for (const [id, p] of presences.entries()) {
    if (now - p.lastPing > 90000) {
      presences.delete(id);
    }
  }

  electionState.totalConnected = presences.size;
  electionState.totalVotesRound1 = secretVotesRound1.length;
  electionState.totalVotesRound2 = secretVotesRound2.length;

  const payload = JSON.stringify({
    electionState,
    results: cachedResults,
  });

  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Heartbeat SSE a cada 15s
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(': ping\n\n');
    } catch {
      sseClients.delete(client);
    }
  }
}, 15000);

// ============================================================================
// ROTAS DE API REST & SSE
// ============================================================================

// Endpoint SSE
app.get('/api/events', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  res.write('\n');
  sseClients.add(res);

  // Envia estado atual imediatamente
  const payload = JSON.stringify({
    electionState,
    results: cachedResults,
  });
  res.write(`data: ${payload}\n\n`);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// Consulta de status para inicialização do cliente
app.get('/api/status', (req: Request, res: Response) => {
  const deviceId = req.query.deviceId as string;
  let hasVotedInRound = false;

  if (deviceId && presences.has(deviceId)) {
    const student = presences.get(deviceId)!;
    student.lastPing = Date.now();
    hasVotedInRound = electionState.currentRound === 1 ? student.votedRound1 : student.votedRound2;
  }

  electionState.totalConnected = presences.size;
  electionState.totalVotesRound1 = secretVotesRound1.length;
  electionState.totalVotesRound2 = secretVotesRound2.length;

  res.json({
    electionState: {
      ...electionState,
      hasVotedInRound,
    },
    results: cachedResults,
  });
});

// Entrada do aluno na sessão (apelido)
app.post('/api/join', (req: Request, res: Response) => {
  const { deviceId, nickname } = req.body;
  if (!deviceId || !nickname) {
    res.status(400).json({ error: 'deviceId e nickname são obrigatórios.' });
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
      votedRound2: false,
    });
  }

  broadcastState();
  res.json({ success: true, nickname });
});

// Voto da Urna Eletrônica (SECRETO)
app.post('/api/vote', (req: Request, res: Response) => {
  const { deviceId, vote } = req.body;

  if (!deviceId || !vote) {
    res.status(400).json({ error: 'Dados de voto incompletos.' });
    return;
  }

  if (!electionState.urnaOpen) {
    res.status(403).json({ error: 'A urna está temporariamente travada pelo professor.' });
    return;
  }

  let student = presences.get(deviceId);
  if (!student) {
    // Registra presença automática se não tiver entrado formalmente
    student = {
      deviceId,
      nickname: 'Estudante',
      connectedAt: Date.now(),
      lastPing: Date.now(),
      votedRound1: false,
      votedRound2: false,
    };
    presences.set(deviceId, student);
  }

  // Prevenção de voto duplo por turno
  const currentRound = electionState.currentRound;
  if (currentRound === 1 && student.votedRound1) {
    res.status(400).json({ error: 'Você já votou no 1º turno.' });
    return;
  }
  if (currentRound === 2 && student.votedRound2) {
    res.status(400).json({ error: 'Você já votou no 2º turno.' });
    return;
  }

  // Marca que o dispositivo votou
  if (currentRound === 1) {
    student.votedRound1 = true;
  } else {
    student.votedRound2 = true;
  }

  // Gravação na urna secreta DESVINCULADA: apenas voto e turno
  const targetList = currentRound === 1 ? secretVotesRound1 : secretVotesRound2;
  targetList.push({
    candidateNumber: String(vote),
    round: currentRound,
    recordedAt: Date.now(),
  });

  broadcastState();
  res.json({ success: true, message: 'Voto registrado com sigilo absoluto!' });
});

// Ações do Professor
app.post('/api/admin/toggle-urna', (req: Request, res: Response) => {
  const { open } = req.body;
  electionState.urnaOpen = Boolean(open);
  if (electionState.urnaOpen) {
    electionState.status = 'voting';
  }
  broadcastState();
  res.json({ success: true, urnaOpen: electionState.urnaOpen });
});

app.post('/api/admin/present', (req: Request, res: Response) => {
  const { candidateId } = req.body;
  electionState.activePresentation = candidateId || null;
  broadcastState();
  res.json({ success: true, activePresentation: electionState.activePresentation });
});

// Apuração de Votos
app.post('/api/admin/tally', (_req: Request, res: Response) => {
  electionState.urnaOpen = false;
  electionState.status = 'finished';

  const round = electionState.currentRound;
  const votes = round === 1 ? secretVotesRound1 : secretVotesRound2;
  const totalVotes = votes.length;

  let blankCount = 0;
  let nullCount = 0;
  const candidateCounts: Record<string, number> = {};

  for (const cId of electionState.activeCandidates) {
    candidateCounts[cId] = 0;
  }

  for (const v of votes) {
    if (v.candidateNumber === 'branco') {
      blankCount++;
    } else if (v.candidateNumber === 'nulo' || !electionState.activeCandidates.includes(v.candidateNumber)) {
      nullCount++;
    } else {
      candidateCounts[v.candidateNumber] = (candidateCounts[v.candidateNumber] || 0) + 1;
    }
  }

  // Votos válidos não incluem brancos nem nulos
  const validVotes = totalVotes - blankCount - nullCount;

  const candidateNames: Record<string, { name: string; focus: string }> = {
    '91': { name: 'Clara Nogueira', focus: 'Transporte Público' },
    '92': { name: 'Samuel Oliveira', focus: 'Saúde Básica' },
    '93': { name: 'Osvaldo Ribeiro', focus: 'Creches e Bairros' },
  };

  const candidateResults: Record<string, any> = {};
  for (const cId of electionState.activeCandidates) {
    const cVotes = candidateCounts[cId] || 0;
    const percentValid = validVotes > 0 ? Number(((cVotes / validVotes) * 100).toFixed(1)) : 0;
    const percentTotal = totalVotes > 0 ? Number(((cVotes / totalVotes) * 100).toFixed(1)) : 0;

    candidateResults[cId] = {
      number: cId,
      name: candidateNames[cId]?.name || `Candidato ${cId}`,
      focus: candidateNames[cId]?.focus || '',
      votes: cVotes,
      percentValid,
      percentTotal,
    };
  }

  // Ordena candidatos por votos válidos decrescentes
  const sorted = Object.values(candidateResults).sort((a: any, b: any) => b.votes - a.votes);

  let winnerId: string | null = null;
  let needsSecondRound = false;
  let secondRoundCandidates: [string, string] | undefined = undefined;
  let tieDetected = false;
  let tieCandidates: string[] = [];

  if (round === 1) {
    const top1 = sorted[0];
    const top2 = sorted[1];
    const top3 = sorted[2];

    // Regra da Maioria Absoluta: Mais de 50% dos votos VÁLIDOS
    if (top1 && top1.votes > validVotes / 2 && validVotes > 0) {
      winnerId = top1.number;
      needsSecondRound = false;
    } else {
      needsSecondRound = true;
      // Verifica empate para o segundo lugar
      if (top2 && top3 && top2.votes === top3.votes && top2.votes > 0) {
        tieDetected = true;
        tieCandidates = [top2.number, top3.number];
        secondRoundCandidates = [top1.number, top2.number];
      } else if (top1 && top2) {
        secondRoundCandidates = [top1.number, top2.number];
      }
    }
  } else {
    // 2º Turno: quem tiver mais votos válidos vence
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
      percentTotal: totalVotes > 0 ? Number(((blankCount / totalVotes) * 100).toFixed(1)) : 0,
    },
    nullVotes: {
      votes: nullCount,
      percentTotal: totalVotes > 0 ? Number(((nullCount / totalVotes) * 100).toFixed(1)) : 0,
    },
    connectedStudents: presences.size,
    abstentions: Math.max(0, presences.size - totalVotes),
    winnerId,
    needsSecondRound,
    secondRoundCandidates,
    tieDetected,
    tieCandidates,
  };

  broadcastState();
  res.json({ success: true, results: cachedResults });
});

// Início do 2º Turno
app.post('/api/admin/second-round', (req: Request, res: Response) => {
  const { candidates } = req.body;
  if (!candidates || !Array.isArray(candidates) || candidates.length !== 2) {
    res.status(400).json({ error: 'É necessário informar exatamente os 2 candidatos finalistas.' });
    return;
  }

  electionState.currentRound = 2;
  electionState.activeCandidates = candidates;
  electionState.urnaOpen = true;
  electionState.status = 'voting';
  electionState.activePresentation = null;
  cachedResults = null;

  // Reseta votos do 2º turno
  secretVotesRound2.length = 0;
  for (const student of presences.values()) {
    student.votedRound2 = false;
  }

  broadcastState();
  res.json({ success: true, electionState });
});

// Reiniciar Eleição Completa
app.post('/api/admin/reset', (_req: Request, res: Response) => {
  secretVotesRound1.length = 0;
  secretVotesRound2.length = 0;
  cachedResults = null;

  electionState = {
    status: 'waiting',
    urnaOpen: false,
    currentRound: 1,
    activePresentation: null,
    activeCandidates: ['91', '92', '93'],
    totalConnected: presences.size,
    totalVotesRound1: 0,
    totalVotesRound2: 0,
  };

  for (const student of presences.values()) {
    student.votedRound1 = false;
    student.votedRound2 = false;
  }

  broadcastState();
  res.json({ success: true, message: 'Eleição reiniciada com sucesso.' });
});

// Simulação de votos da turma para teste rápido do professor
app.post('/api/admin/simulate-votes', (req: Request, res: Response) => {
  const count = Number(req.body.count) || 5;
  const currentRound = electionState.currentRound;
  const activeCandidates = electionState.activeCandidates;
  const targetList = currentRound === 1 ? secretVotesRound1 : secretVotesRound2;

  const sampleNames = ['Bia', 'Lucas', 'Enzo', 'Valentina', 'Guilherme', 'Mariana', 'Thiago', 'Larissa', 'Matheus', 'Camila'];

  for (let i = 0; i < count; i++) {
    const simId = 'sim_' + Math.random().toString(36).substring(2, 9);
    const simName = sampleNames[Math.floor(Math.random() * sampleNames.length)] + ' ' + (presences.size + 1);

    presences.set(simId, {
      deviceId: simId,
      nickname: simName,
      connectedAt: Date.now(),
      lastPing: Date.now(),
      votedRound1: true,
      votedRound2: currentRound === 2,
    });

    const rand = Math.random();
    let chosen = activeCandidates[Math.floor(Math.random() * activeCandidates.length)];
    if (rand < 0.05) chosen = 'branco';
    else if (rand < 0.08) chosen = 'nulo';

    targetList.push({
      candidateNumber: chosen,
      round: currentRound,
      recordedAt: Date.now(),
    });
  }

  broadcastState();
  res.json({ success: true, added: count });
});

// ============================================================================
// INICIALIZAÇÃO DO SERVIDOR COM VITE EM DESENVOLVIMENTO / DIST EM PROD
// ============================================================================

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Eleição Vila Esperança rodando em http://localhost:${PORT}`);
  });
}

startServer();
