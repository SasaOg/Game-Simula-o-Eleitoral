# 🗳️ Eleição Vila Esperança — Urna Eletrônica Educativa

Aplicativo web interativo em **Português do Brasil** que simula uma **eleição municipal para Prefeito(a)** na cidade fictícia de **Vila Esperança**, com réplica fiel da **Urna Eletrônica brasileira** e sincronização em tempo real na nuvem.

Desenvolvido especialmente para uso ao vivo em aulas online de **Ensino Sociocultural** com estudantes do Ensino Médio: os alunos participam e votam pelo celular sem necessidade de login, enquanto o professor conduz o debate, apresenta os candidatos e exibe a apuração ao vivo na tela compartilhada.

---

## 🎯 Modos de Acesso

O sistema funciona com dois links diretos no mesmo aplicativo (sem criação de conta ou senha para os participantes):

- **Modo Aluno (`/?modo=aluno`)**  
  Interface otimizada para celular:
  1. Entrada rápida apenas com apelido ou primeiro nome.
  2. Consulta à **Colinha dos Candidatos** e acompanhamento automático do candidato destacado pelo professor.
  3. **Sala de Espera** enquanto a urna está travada pelo professor.
  4. **Urna Eletrônica** interativa quando liberada, com áudio de teclas e som oficial de confirmação, exibindo a tela `FIM`.
  5. Tela de espera da apuração e **Resultado Oficial** ao vivo (1º turno, convocação de 2º turno ou eleição finalizada).

- **Modo Professor (`/?modo=professor`)**  
  Painel completo para compartilhamento de tela:
  - **QR Code e Link Público**: modal pronto para projetar na chamada de vídeo e copiar o link direto do Modo Aluno.
  - **Contadores em Tempo Real**: acompanhamento simultâneo de alunos **Conectados** e que **Já Votaram**.
  - **Controle da Urna**: botões para liberar ou travar a votação a qualquer momento.
  - **Colinha da Turma**: cartões dos candidatos com o botão **Apresentar à turma**, que destaca o perfil em tempo real nos celulares dos alunos.
  - **Apuração com Pop-up Automático**: ao clicar em **Apurar Votos**, toca o rufar de tambores e abre automaticamente um modal centralizado com o gráfico de desempenho, votos válidos, brancos, nulos, abstenções e regra de 2º turno.
  - **Ferramentas de Teste e Gestão**: `+5 Votos Teste` para demonstração rápida, `Limpar Votos`, `Reiniciar Eleição` e botão `Ver como Aluno`.

---

## 👥 Candidatos Fictícios de Vila Esperança

Todos os personagens, propostas e dilemas são fictícios, sem vínculo partidário ou referência a figuras reais, estruturados para provocar debate sobre orçamento público e escolhas políticas:

| Número | Candidato(a) | Foco | Slogan |
| :---: | :--- | :--- | :--- |
| **91** | **Clara Nogueira** (38 anos, Engenheira de tráfego) | Transporte Público | *"A cidade que anda."* |
| **92** | **Samuel Oliveira** (42 anos, Enfermeiro de posto de saúde) | Saúde Básica | *"Cuidado perto de casa."* |
| **93** | **Osvaldo Ribeiro** (67 anos, Mestre de obras e líder comunitário) | Creches e Bairros | *"Nenhum bairro fica para trás."* |

### Resumo das Propostas e Dilemas

- **Nº 91 — Clara Nogueira**
  1. Tarifa zero nos ônibus municipais para estudantes e pessoas desempregadas.
  2. Implantação de faixas exclusivas de ônibus nas avenidas principais para reduzir tempo de trajeto.
  3. Aumentar o ISS (imposto sobre serviços) dos aplicativos de corrida e de entrega para 5%, o máximo permitido, e usar o dinheiro para pagar a tarifa zero dos estudantes e desempregados.
  - *Pergunta do povo:* "Se Uber e iFood ficarem mais caros, o motorista e o entregador não vão ganhar menos?"

- **Nº 92 — Samuel Oliveira**
  1. Postos de saúde abertos até as 22h em todos os bairros da cidade para atender quem trabalha durante o dia.
  2. Prazo máximo de 30 dias para consultas com especialistas e exames, com mutirões noturnos e fins de semana, contratando clínicas particulares se a rede pública não suprir.
  3. Proibir a venda e a oferta de refrigerante, salgadinho e outros ultraprocessados em todas as escolas da cidade, públicas e particulares, com multa para quem descumprir, e baratear frutas e lanches saudáveis.
  - *Pergunta da população:* "E se não der para cumprir o prazo de agendamento de consultas e exames em 30 dias? Qual seria a solução do candidato?"

- **Nº 93 — Osvaldo Ribeiro**
  1. Construção e ampliação de creches de tempo integral em todo bairro, garantindo vaga para 100% das crianças.
  2. Mutirão de obras de saneamento básico, iluminação LED e praças comunitárias com prioridade máxima para a periferia.
  3. Adiar os projetos de reforma e embelezamento da avenida central e a ampliação do estádio municipal para realocar a verba nas creches e no saneamento.
  - *Pergunta do povo:* "A avenida central é o cartão-postal da cidade e dá emprego ao comércio. Vale a pena deixar isso parado?"

---

## ⚖️ Regras da Simulação e Sigilo do Voto

- **Sigilo Absoluto**: A identificação do dispositivo (`presences`) registra apenas se o aluno já votou no 1º ou 2º turno para evitar voto duplicado. As cédulas depositadas (`secret_votes_r1` e `secret_votes_r2`) são gravadas de forma totalmente anônima, sem apelido ou identificador do estudante.
- **Votos Válidos, Brancos e Nulos**:
  - Pressionar **BRANCO** com o visor vazio registra voto em branco.
  - Digitar um número inexistente e pressionar **CONFIRMA** registra voto nulo.
  - Percentuais dos candidatos são calculados sobre os **votos válidos** (excluindo brancos e nulos), seguindo a legislação eleitoral brasileira.
- **1º e 2º Turno**:
  - Vence no 1º turno quem obtiver **mais de 50% dos votos válidos** (maioria absoluta).
  - Caso ninguém atinja essa marca, o sistema habilita o **2º Turno** com os dois candidatos mais votados (com suporte a escolha manual pelo professor em caso de empate na 2ª vaga).

---

## 🏗️ Arquitetura e Tecnologias

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
- **Tempo Real e Persistência**: Firebase Firestore (`onSnapshot`, `writeBatch`, validação em `firestore.rules`)
- **Áudio**: Reprodução do som oficial de confirmação (`/public/assets/aistudio/confirma-urna_91ce1866.mp3`) com síntese de reserva via Web Audio API (bipes das teclas, rufar de tambores e trilha de espera)
- **QR Code**: Biblioteca `qrcode` para geração dinâmica do código de acesso dos estudantes
- **Servidor**: Express + Vite middleware (`server.ts`)

### Estrutura de Coleções no Firestore

- `election_state/main`: estado global da eleição (`status`, `urnaLiberada`, `turno`, `candidatoApresentadoId`, `candidatosAtivos`).
- `election_results/main`: resultado consolidado publicado para toda a turma após a apuração.
- `presences/{deviceId}`: controle de presença e status de votação por dispositivo.
- `secret_votes_r1/{voteId}` e `secret_votes_r2/{voteId}`: cédulas anônimas e imutáveis do 1º e 2º turnos.

---

## 📁 Estrutura de Pastas

```text
├── public/assets/aistudio/     # Áudio oficial da urna e assets públicos
├── src/
│   ├── components/
│   │   ├── CandidateAvatar.tsx # Avatares ilustrados dos candidatos
│   │   ├── ColinhaModal.tsx    # Colinha responsiva (desktop e mobile)
│   │   ├── MascotAvatar.tsx    # Mascote da Justiça Eleitoral Escolar
│   │   ├── PainelProfessor.tsx # Painel de controle do professor
│   │   ├── QRCodeModal.tsx     # Modal de QR Code e link público
│   │   ├── ResultadoModal.tsx  # Pop-up automático de resultado da apuração
│   │   ├── StudentVotingFlow.tsx # Fluxo completo do estudante
│   │   └── UrnaEletronica.tsx  # Réplica interativa da Urna Eletrônica
│   ├── data/
│   │   └── candidates.ts       # Dados dos candidatos de Vila Esperança
│   ├── services/
│   │   └── electionFirestore.ts # Operações em tempo real no Firestore
│   ├── types/
│   │   └── election.ts         # Tipagens TypeScript da eleição
│   ├── utils/
│   │   ├── audio.ts            # Motor de áudio da urna e trilha sonora
│   │   └── url.ts              # Utilitário de links Aluno/Professor
│   ├── App.tsx                 # Orquestração principal e listeners
│   └── firebase.ts             # Inicialização do Firebase e tratamento de erros
├── firebase-applet-config.example.json # Modelo de configuração do Firebase
├── firebase-blueprint.json     # Modelo estrutural das entidades no Firestore
├── firestore.rules             # Regras de validação e segurança do banco
├── server.ts                   # Servidor Express para desenvolvimento/produção
└── package.json
```

---

## 🚀 Como Executar Localmente

1. **Instale as dependências**:
   ```bash
   npm install
   ```

2. **Configure o Firebase**:
   Copie o arquivo `firebase-applet-config.example.json` para `firebase-applet-config.json` na raiz do projeto e preencha com as credenciais do seu projeto Firebase:
   ```bash
   cp firebase-applet-config.example.json firebase-applet-config.json
   ```

3. **Inicie o servidor de desenvolvimento** (porta `3000`):
   ```bash
   npm run dev
   ```

4. **Acesse no navegador**:
   - Modo Professor: `http://localhost:3000/?modo=professor`
   - Modo Aluno: `http://localhost:3000/?modo=aluno`

5. **Verificação de tipos e build de produção**:
   ```bash
   npm run lint
   npm run build
   ```
