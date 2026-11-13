import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ElectionResults, CandidateResult } from '../types/election';

const CANDIDATE_NAMES: Record<string, { name: string; focus: string }> = {
  '91': { name: 'Clara Nogueira', focus: 'Transporte Público' },
  '92': { name: 'Samuel Oliveira', focus: 'Saúde Básica' },
  '93': { name: 'Osvaldo Ribeiro', focus: 'Creches e Bairros' },
};

export interface FirestoreElectionDoc {
  status: 'aguardando' | 'votacao' | 'apurando' | 'encerrada';
  urnaLiberada: boolean;
  turno: number;
  candidatoApresentadoId: string;
  candidatosAtivos: string[];
  updatedAt: string;
}

export interface FirestorePresenceDoc {
  deviceId: string;
  nickname: string;
  hasVotedRound1: boolean;
  hasVotedRound2: boolean;
  lastSeen: string;
}

export interface FirestoreVoteDoc {
  candidateNumber: '91' | '92' | '93' | 'BRANCO' | 'NULO';
  round: number;
  timestamp: string;
}

/**
 * Inicializa ou escuta o documento central da eleição
 */
export function subscribeToElectionState(
  onUpdate: (data: FirestoreElectionDoc) => void,
  onError?: (err: unknown) => void
) {
  const path = 'election_state/main';
  const electionRef = doc(db, 'election_state', 'main');

  return onSnapshot(
    electionRef,
    async (snapshot) => {
      if (!snapshot.exists()) {
        const initial: FirestoreElectionDoc = {
          status: 'aguardando',
          urnaLiberada: false,
          turno: 1,
          candidatoApresentadoId: '',
          candidatosAtivos: ['91', '92', '93'],
          updatedAt: new Date().toISOString(),
        };
        try {
          await setDoc(electionRef, initial);
          onUpdate(initial);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
      } else {
        onUpdate(snapshot.data() as FirestoreElectionDoc);
      }
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Escuta os resultados apurados oficiais sincronizados na nuvem
 */
export function subscribeToElectionResults(
  onResults: (res: ElectionResults | null) => void,
  onError?: (err: unknown) => void
) {
  const path = 'election_results/main';
  const resultsRef = doc(db, 'election_results', 'main');

  return onSnapshot(
    resultsRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onResults(data as ElectionResults);
      } else {
        onResults(null);
      }
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Escuta as presenças dos alunos
 */
export function subscribeToPresences(
  onUpdate: (presences: FirestorePresenceDoc[]) => void,
  onError?: (err: unknown) => void
) {
  const path = 'presences';
  const presencesRef = collection(db, 'presences');

  return onSnapshot(
    presencesRef,
    (snapshot) => {
      const list: FirestorePresenceDoc[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as FirestorePresenceDoc);
      });
      onUpdate(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Escuta a quantidade de votos de um turno
 */
export function subscribeToVotesCount(
  round: 1 | 2,
  onCount: (count: number) => void,
  onError?: (err: unknown) => void
) {
  const collectionName = round === 1 ? 'secret_votes_r1' : 'secret_votes_r2';
  const votesRef = collection(db, collectionName);

  return onSnapshot(
    votesRef,
    (snapshot) => {
      onCount(snapshot.size);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, collectionName);
    }
  );
}

/**
 * Registra ou atualiza presença do aluno
 */
export async function registerPresence(deviceId: string, nickname: string) {
  const path = `presences/${deviceId}`;
  try {
    const presenceRef = doc(db, 'presences', deviceId);
    const snap = await getDoc(presenceRef);
    if (snap.exists()) {
      await updateDoc(presenceRef, {
        nickname: nickname.slice(0, 32),
        lastSeen: new Date().toISOString(),
      });
    } else {
      const newPresence: FirestorePresenceDoc = {
        deviceId: deviceId.slice(0, 64),
        nickname: nickname.slice(0, 32),
        hasVotedRound1: false,
        hasVotedRound2: false,
        lastSeen: new Date().toISOString(),
      };
      await setDoc(presenceRef, newPresence);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Aluno deposita voto na urna (SIGILO ABSOLUTO)
 */
export async function castVoteInFirestore(
  deviceId: string,
  rawVote: string,
  round: 1 | 2
): Promise<void> {
  const voteCollectionName = round === 1 ? 'secret_votes_r1' : 'secret_votes_r2';

  let normalizedCandidate: '91' | '92' | '93' | 'BRANCO' | 'NULO';
  const lower = rawVote.toLowerCase();
  if (lower === 'branco') normalizedCandidate = 'BRANCO';
  else if (lower === 'nulo') normalizedCandidate = 'NULO';
  else if (rawVote === '91' || rawVote === '92' || rawVote === '93') normalizedCandidate = rawVote;
  else normalizedCandidate = 'NULO';

  try {
    // 1. Marca no registro do aluno que ele já votou neste turno
    const presenceRef = doc(db, 'presences', deviceId);
    const pSnap = await getDoc(presenceRef);
    if (pSnap.exists()) {
      const data = pSnap.data() as FirestorePresenceDoc;
      if (round === 1 && data.hasVotedRound1) {
        throw new Error('Você já votou no 1º turno.');
      }
      if (round === 2 && data.hasVotedRound2) {
        throw new Error('Você já votou no 2º turno.');
      }
      await updateDoc(presenceRef, {
        ...(round === 1 ? { hasVotedRound1: true } : { hasVotedRound2: true }),
        lastSeen: new Date().toISOString(),
      });
    } else {
      const newPresence: FirestorePresenceDoc = {
        deviceId: deviceId.slice(0, 64),
        nickname: 'Estudante',
        hasVotedRound1: round === 1,
        hasVotedRound2: round === 2,
        lastSeen: new Date().toISOString(),
      };
      await setDoc(presenceRef, newPresence);
    }

    // 2. Deposita a cédula ANÔNIMA na urna (coleção desvinculada)
    const newVoteRef = doc(collection(db, voteCollectionName));
    const votePayload: FirestoreVoteDoc = {
      candidateNumber: normalizedCandidate,
      round,
      timestamp: new Date().toISOString(),
    };
    await setDoc(newVoteRef, votePayload);
  } catch (err) {
    if (err instanceof Error && err.message.includes('já votou')) {
      throw err;
    }
    handleFirestoreError(err, OperationType.WRITE, voteCollectionName);
  }
}

/**
 * Professor abre ou trava a urna
 */
export async function toggleUrnaInFirestore(open: boolean) {
  const path = 'election_state/main';
  try {
    const electionRef = doc(db, 'election_state', 'main');
    await updateDoc(electionRef, {
      urnaLiberada: open,
      status: open ? 'votacao' : 'aguardando',
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/**
 * Professor apresenta candidato em destaque
 */
export async function presentCandidateInFirestore(candidateId: string | null) {
  const path = 'election_state/main';
  try {
    const electionRef = doc(db, 'election_state', 'main');
    await updateDoc(electionRef, {
      candidatoApresentadoId: candidateId || '',
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/**
 * Apuração de votos em tempo real e publicação na nuvem para toda a turma
 */
export async function tallyVotesFromFirestore(
  roundFallback: 1 | 2,
  activeCandidatesFallback: string[],
  totalConnected: number
): Promise<ElectionResults> {
  try {
    // 1. Lê o estado oficial direto da nuvem para garantir sincronia absoluta de turno e candidatos
    const electionRef = doc(db, 'election_state', 'main');
    const electionSnap = await getDoc(electionRef);
    const electionData = electionSnap.exists() ? (electionSnap.data() as FirestoreElectionDoc) : null;

    const round: 1 | 2 = electionData?.turno === 2 ? 2 : (roundFallback === 2 ? 2 : 1);
    const activeCandidates = (electionData?.candidatosAtivos && electionData.candidatosAtivos.length > 0)
      ? electionData.candidatosAtivos
      : activeCandidatesFallback;

    const collectionName = round === 1 ? 'secret_votes_r1' : 'secret_votes_r2';

    // 2. Trava a urna e define status como encerrada
    await updateDoc(electionRef, {
      urnaLiberada: false,
      status: 'encerrada',
      updatedAt: new Date().toISOString(),
    });

    // 3. Busca todas as cédulas anônimas do turno correspondente
    const votesSnap = await getDocs(collection(db, collectionName));
    const totalVotes = votesSnap.size;

    let blankCount = 0;
    let nullCount = 0;
    const candidateCounts: Record<string, number> = {};

    for (const cId of activeCandidates) {
      candidateCounts[cId] = 0;
    }

    votesSnap.forEach((docSnap) => {
      const data = docSnap.data() as FirestoreVoteDoc;
      if (data.candidateNumber === 'BRANCO') {
        blankCount++;
      } else if (data.candidateNumber === 'NULO' || !activeCandidates.includes(data.candidateNumber)) {
        nullCount++;
      } else {
        candidateCounts[data.candidateNumber] = (candidateCounts[data.candidateNumber] || 0) + 1;
      }
    });

    const validVotes = totalVotes - blankCount - nullCount;

    const candidateResults: Record<string, CandidateResult> = {};
    for (const cId of activeCandidates) {
      const cVotes = candidateCounts[cId] || 0;
      const percentValid = validVotes > 0 ? Number(((cVotes / validVotes) * 100).toFixed(1)) : 0;
      const percentTotal = totalVotes > 0 ? Number(((cVotes / totalVotes) * 100).toFixed(1)) : 0;

      candidateResults[cId] = {
        number: cId,
        name: CANDIDATE_NAMES[cId]?.name || `Candidato ${cId}`,
        focus: CANDIDATE_NAMES[cId]?.focus || '',
        votes: cVotes,
        percentValid,
        percentTotal,
      };
    }

    const sorted = Object.values(candidateResults).sort((a, b) => b.votes - a.votes);

    let winnerId: string | null = null;
    let needsSecondRound = false;
    let secondRoundCandidates: [string, string] | null = null;
    let tieDetected = false;
    let tieCandidates: string[] = [];

    if (round === 1) {
      const top1 = sorted[0];
      const top2 = sorted[1];
      const top3 = sorted[2];

      // Regra da Maioria Absoluta no 1º Turno: Mais de 50% dos votos VÁLIDOS
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
        } else if (activeCandidates.length >= 2) {
          secondRoundCandidates = [activeCandidates[0], activeCandidates[1]];
        }
      }
    } else {
      // 2º Turno: quem tiver mais votos válidos vence
      const top1 = sorted[0];
      const top2 = sorted[1];
      needsSecondRound = false;

      if (top1 && top2 && top1.votes === top2.votes && top1.votes > 0) {
        tieDetected = true;
        tieCandidates = [top1.number, top2.number];
        winnerId = top1.number;
      } else if (top1 && top1.votes > 0) {
        winnerId = top1.number;
      }
    }

    // Objeto limpo e estritamente formatado SEM NENHUM campo undefined (evita erro no Firestore)
    const resultsPayload: Record<string, any> = {
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
      connectedStudents: totalConnected,
      abstentions: Math.max(0, totalConnected - totalVotes),
      winnerId: winnerId || null,
      needsSecondRound: Boolean(needsSecondRound),
      tieDetected: Boolean(tieDetected),
      tieCandidates: tieCandidates || [],
      updatedAt: new Date().toISOString(),
    };

    if (secondRoundCandidates && secondRoundCandidates.length === 2) {
      resultsPayload.secondRoundCandidates = secondRoundCandidates;
    }

    // 4. Salva no Firestore: isso dispara o onSnapshot em TODOS os celulares dos alunos!
    const resultsRef = doc(db, 'election_results', 'main');
    await setDoc(resultsRef, resultsPayload);

    return resultsPayload as unknown as ElectionResults;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'election_results/main');
    throw err;
  }
}

/**
 * Iniciar 2º Turno
 */
export async function startSecondRoundInFirestore(candidates: [string, string]) {
  const path = 'election_state/main';
  try {
    const electionRef = doc(db, 'election_state', 'main');
    await updateDoc(electionRef, {
      status: 'votacao',
      urnaLiberada: true,
      turno: 2,
      candidatoApresentadoId: '',
      candidatosAtivos: candidates,
      updatedAt: new Date().toISOString(),
    });

    // Remove resultados do 1º turno para que os alunos vejam a urna do 2º turno
    const resultsRef = doc(db, 'election_results', 'main');
    await deleteDoc(resultsRef).catch(() => {});

    // Zera os votos do 2º turno se houver
    const r2Snap = await getDocs(collection(db, 'secret_votes_r2'));
    const batch = writeBatch(db);
    r2Snap.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });

    // Reseta flag hasVotedRound2 dos alunos
    const presencesSnap = await getDocs(collection(db, 'presences'));
    presencesSnap.forEach((docSnap) => {
      batch.update(docSnap.ref, { hasVotedRound2: false });
    });

    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Reiniciar Eleição Completa
 */
export async function resetElectionInFirestore() {
  const path = 'election_state/main';
  try {
    const electionRef = doc(db, 'election_state', 'main');
    await updateDoc(electionRef, {
      status: 'aguardando',
      urnaLiberada: false,
      turno: 1,
      candidatoApresentadoId: '',
      candidatosAtivos: ['91', '92', '93'],
      updatedAt: new Date().toISOString(),
    });

    // Remove resultados apurados
    const resultsRef = doc(db, 'election_results', 'main');
    await deleteDoc(resultsRef).catch(() => {});

    const batch = writeBatch(db);

    const r1Snap = await getDocs(collection(db, 'secret_votes_r1'));
    r1Snap.forEach((d) => batch.delete(d.ref));

    const r2Snap = await getDocs(collection(db, 'secret_votes_r2'));
    r2Snap.forEach((d) => batch.delete(d.ref));

    const presencesSnap = await getDocs(collection(db, 'presences'));
    presencesSnap.forEach((d) => {
      batch.update(d.ref, { hasVotedRound1: false, hasVotedRound2: false });
    });

    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Limpar apenas os votos de teste / simulação e zerar contadores sem desconectar alunos
 */
export async function clearTestVotesInFirestore() {
  const path = 'secret_votes_r1';
  try {
    const batch = writeBatch(db);

    // Remove todas as cédulas depositadas
    const r1Snap = await getDocs(collection(db, 'secret_votes_r1'));
    r1Snap.forEach((d) => batch.delete(d.ref));

    const r2Snap = await getDocs(collection(db, 'secret_votes_r2'));
    r2Snap.forEach((d) => batch.delete(d.ref));

    // Remove alunos simulados e limpa a flag de já votou dos alunos reais
    const presencesSnap = await getDocs(collection(db, 'presences'));
    presencesSnap.forEach((d) => {
      if (d.id.startsWith('sim_')) {
        batch.delete(d.ref);
      } else {
        batch.update(d.ref, { hasVotedRound1: false, hasVotedRound2: false });
      }
    });

    // Remove resultados apurados anteriores
    const resultsRef = doc(db, 'election_results', 'main');
    batch.delete(resultsRef);

    // Retorna estado para aguardando
    const electionRef = doc(db, 'election_state', 'main');
    batch.update(electionRef, {
      status: 'aguardando',
      urnaLiberada: false,
      turno: 1,
      candidatoApresentadoId: '',
      candidatosAtivos: ['91', '92', '93'],
      updatedAt: new Date().toISOString(),
    });

    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Simular votos rápidos para teste em sala de aula
 */
export async function simulateVotesInFirestore(
  count: number,
  roundFallback: 1 | 2,
  activeCandidatesFallback: string[]
) {
  try {
    // Busca estado oficial para saber o turno exato
    const electionRef = doc(db, 'election_state', 'main');
    const electionSnap = await getDoc(electionRef);
    const electionData = electionSnap.exists() ? (electionSnap.data() as FirestoreElectionDoc) : null;

    const round: 1 | 2 = electionData?.turno === 2 ? 2 : (roundFallback === 2 ? 2 : 1);
    const activeCandidates = (electionData?.candidatosAtivos && electionData.candidatosAtivos.length > 0)
      ? electionData.candidatosAtivos
      : activeCandidatesFallback;

    const collectionName = round === 1 ? 'secret_votes_r1' : 'secret_votes_r2';
    const sampleNames = ['Bia', 'Lucas', 'Enzo', 'Valentina', 'Guilherme', 'Mariana', 'Thiago', 'Larissa', 'Matheus', 'Camila'];

    const batch = writeBatch(db);

    for (let i = 0; i < count; i++) {
      const simId = 'sim_' + Math.random().toString(36).substring(2, 9);
      const simName = sampleNames[Math.floor(Math.random() * sampleNames.length)] + ' ' + (i + 1);

      const pRef = doc(db, 'presences', simId);
      batch.set(pRef, {
        deviceId: simId,
        nickname: simName,
        hasVotedRound1: true,
        hasVotedRound2: round === 2,
        lastSeen: new Date().toISOString(),
      });

      const rand = Math.random();
      let chosen: '91' | '92' | '93' | 'BRANCO' | 'NULO';
      if (rand < 0.05) chosen = 'BRANCO';
      else if (rand < 0.08) chosen = 'NULO';
      else {
        chosen = activeCandidates[Math.floor(Math.random() * activeCandidates.length)] as any;
      }

      const vRef = doc(collection(db, collectionName));
      batch.set(vRef, {
        candidateNumber: chosen,
        round,
        timestamp: new Date().toISOString(),
      });
    }

    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'secret_votes_r1');
  }
}
