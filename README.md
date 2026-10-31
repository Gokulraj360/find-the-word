# Cognitor — The Bayesian Mind Guesser

Cognitor is an advanced, high-performance 20-questions style guessing engine inspired by Akinator. Built with a pure Bayesian inference engine, Beta-prior soft counts, an in-memory `Float32Array` matrix, an Expected Information Gain question selection algorithm, a self-tuning learning loop, and a minimal, distraction-free UI.

---

## 1. System Architecture & Workflow Diagram

```mermaid
flowchart TD
    subgraph Data Pipeline
        WD["Wikidata SPARQL / Entities (~5000)"] --> QGen["Question Generator (~200)"]
        QGen --> LLM["LLM Subjective Filler"]
        Seed["seed:small (50x40 Offline Dataset)"] --> DB[(PostgreSQL / Storage)]
        LLM --> DB
    end

    subgraph Server & Bayesian Hot Path
        DB -->|Server Boot / Reload| Matrix["In-Memory Matrix: Float32Array (p_yes, confidence)"]
        Session["Active Session State: P(e) Prior"] <--> Matrix
        Session --> IG["Expected Info-Gain Question Selector"]
        IG --> Q["Next Optimal Question"]
        UserAns["User Answer (1.0, 0.75, 0.5, 0.25, 0.0)"] --> Bayes["Bayesian Update + Clamp Floor (0.03)"]
        Bayes --> Session
        Session --> Guess["Guess Logic (P >= 0.80 & Gap >= 0.25)"]
    end

    subgraph Learning Loop
        Guess -->|Confirmed Win| WinLearn["Update Soft Counts (yes_w, no_w) + Popularity += 1"]
        Guess -->|Rejected / 30 Qs Lost| LearnForm["User Submits Entity + Distinguishing Question"]
        LearnForm --> ModQueue["Moderation Queue (/admin)"]
        ModQueue -->|Admin Approved| DB
        ModQueue -->|Auto-Reload| Matrix
        WinLearn --> DB
    end

    subgraph Single Page UI
        ReactUI["Minimal Plain React UI (One Page)"] <-->|REST API (Zod Validated)| Server["Express API Server"]
        AdminUI["/admin Management Panel"] <-->|JWT Auth| Server
    end
```

---

## 2. Core Engine & Mathematical Principles

### In-Memory Matrix Representation
- On boot, all active entities and questions are loaded into flat, typed `Float32Array`s (`pYes` and `confidence`).
- The entire hot path (calculating likelihoods, updating probabilities, ranking candidates, and computing Shannon entropy) executes purely in memory without hitting the database.
- Memory footprint: $10,000 \text{ entities} \times 500 \text{ questions}$ consumes only **~38 MB** of RAM and evaluates steps in **~81 ms** (well below the 150 ms SLA target).

### Soft Counts & Beta Priors
Rather than storing fixed static percentages, each entity-question relationship is tracked via soft counts:
$$p_{yes} = \frac{yes\_w + \alpha}{yes\_w + no\_w + \alpha + \beta} \quad \text{where } \alpha = 1, \beta = 1$$
$$confidence = yes\_w + no\_w$$
- Pairs with no historical data start at $confidence = 0$.
- The engine distinguishes between an answer with high uncertainty vs a well-established neutral answer ($p_{yes} = 0.5$ with $confidence = 20$).

### Bayesian Update per Answer
For an answer $a \in \{1.0 \text{ (Yes)}, 0.75 \text{ (Probably)}, 0.5 \text{ (Unknown)}, 0.25 \text{ (Probably not)}, 0.0 \text{ (No)}\}$:
1. If $a = 0.5$ (Unknown) or $confidence < 1.0$: $likelihood = 1.0$ (no penalty, no reward).
2. Otherwise:
   $$base = \text{clamp}(1.0 - |a - p_{yes}|, 0.03, 1.0)$$
   $$w = \min(1.8, 0.6 + 0.35 \cdot \log_{10}(1.0 + confidence))$$
   $$likelihood = base^w$$
3. $P(e) \gets P(e) \times likelihood$, followed by normalization $\sum P(e) = 1.0$.
4. **Noise Floor Clamping**: The $0.03$ floor prevents noisy or mistaken user answers from completely eliminating the true entity.

### Question Selection (Expected Information Gain)
- Evaluates the top-300 candidates by probability $P(e)$.
- Simulates all 5 possible user response outcomes for every unasked question.
- Computes the Shannon entropy: $H = -\sum p_i \ln(p_i)$.
- Selects the question with maximum Expected Information Gain $IG = H_0 - E[H \mid q]$.
- **Early Game (Steps 1–3)**: Boosts broad splitters ($p_{yes} \approx 0.5$ across entities).
- **Late Game**: When top 2 candidates hold $> 70\%$ of the probability mass, prioritizes questions with maximum separation $|p_{yes}(c_1) - p_{yes}(c_2)|$.
- **Variety**: Randomly chooses among the top 3 highest-scoring questions so repeated games remain varied.

### Contradiction Handling & Guess Rules
- If after 15 questions $\max P(e) < 0.05$, likelihood weighting is halved ($w \gets w \times 0.5$) to adapt to inconsistent user answers.
- **Guess Trigger**: Proposes a guess when $P_{top1} \ge 0.80$ AND $(P_{top1} - P_{top2}) \ge 0.25$ with $\ge 8$ questions asked, OR at question 25 (forced guess), OR when no questions remain.
- **Rejected Guess**: Drops entity probability to $0.01 \times P$, renormalizes, and continues. Max 3 guesses per game, hard limit of 30 questions.
- **Undo / Back**: Recomputes the exact posterior from the initial prior plus remaining answers, preserving numerical stability.

---

## 3. The Learning Loop

1. **On Win**:
   - Updates soft weights based on answer values ($1.0 \to +1.0\text{ yes\_w}$, $0.0 \to +1.0\text{ no\_w}$, $0.75 \to +0.7\text{ yes\_w} / +0.3\text{ no\_w}$, etc.).
   - Increments entity popularity by $+1$.
   - **Noise Control**: Scales updates by session reliability (games with $>40\%$ "Don't know" are downweighted). Clamps delta to $\le 0.5$ for established pairs ($confidence > 20$).
2. **On Loss**:
   - The user inputs who they were thinking of and a distinguishing question that separates them from Cognitor's closest guess.
   - Creates a pending entity and logs the submission into the moderation queue.
3. **Admin Moderation (`/admin`)**:
   - Password/JWT protected panel.
   - Approving a submission activates the entity, seeds the distinguishing question ($yes\_w = 10 / no\_w = 10$), auto-seeds top 50 entities as unknown, and immediately hot-reloads the in-memory matrix.

---

## 4. Quickstart & Installation

### Prerequisites
- Node.js (v20+ recommended)
- npm (v10+)
- *(Optional)* Docker & Docker Compose (for PostgreSQL container)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(If running without PostgreSQL, Cognitor automatically runs in high-performance local storage mode with JSON persistence).*

### Step 3: Seed the Small Hand-Made Dataset
Populates 50 famous real & fictional characters $\times$ 40 curated questions:
```bash
npm run seed:small
```

### Step 4: Run the Development Server
```bash
# Starts both the backend API (port 3000) and the Vite frontend (port 5173)
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 5. Running the Data Pipeline

| Script | Command | Purpose |
| :--- | :--- | :--- |
| **Seed Small** | `npm run seed:small` | Offline deterministic dataset of 50 entities $\times$ 40 questions. |
| **Wikidata Import** | `npm run import:wikidata` | Queries Wikidata SPARQL for top humans/fictional characters by sitelinks. |
| **Generate Questions** | `npm run generate:questions` | Generates structured questions with deterministic $yes\_w=10 / no\_w=10$ answers. |
| **Fill LLM** | `npm run fill:llm` | Batch fills subjective questions (weight 3) via Claude/Gemini API (or heuristic fallback). |
| **Maintenance** | `npm run maintenance` | Nightly script recalibrating question quality scores from real game information gain. |

---

## 6. Running Simulations & Benchmarks

### Simulation Harness (Bot Evaluation)
Simulates games against automated bots answering with 5% random noise and realistic "probably" distributions:
```bash
npm run simulate
```
- **Target**: $\ge 85\%$ win rate within 25 questions.
- **CI Gate**: Fails with exit code 1 if win rate drops below $70\%$.

### In-Memory Matrix Performance Benchmark
Benchmarks 10,000 entities $\times$ 500 questions (5,000,000 cells):
```bash
npm run benchmark
```
- **Target**: $< 150 \text{ ms}$ per step.
- **Benchmark Result**: ~**81.02 ms** average latency.

### Unit Tests
Comprehensive unit test suite powered by Vitest:
```bash
npm test
```

---

## 7. Running with Docker Compose

To run Cognitor with a production PostgreSQL container:
```bash
docker compose up -d
```
The server will start on `http://localhost:3000`.

---

## 8. REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/game/start` | Start new session $\to$ `{ sessionId, question }` |
| `POST` | `/api/game/answer` | Answer question $\to$ `{ state, question?, guess? }` |
| `POST` | `/api/game/back` | Undo last answer $\to$ `{ question }` |
| `POST` | `/api/game/confirm` | Confirm guess $\to$ `{ state, question?, closestWrongEntity? }` |
| `POST` | `/api/game/learn` | Submit new character on loss $\to$ `{ submissionId }` |
| `GET` | `/api/stats` | Global statistics |
| `POST` | `/api/admin/login` | Admin login $\to$ `{ token }` |
| `GET` | `/api/admin/submissions` | List pending/approved submissions (JWT) |
| `POST` | `/api/admin/submissions/:id/approve` | Approve submission & reload cache (JWT) |
| `POST` | `/api/admin/submissions/:id/reject` | Reject submission (JWT) |
| `POST` | `/api/admin/reload` | Force reload of in-memory matrix (JWT) |
