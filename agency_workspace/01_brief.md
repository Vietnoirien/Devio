# Client Brief

## 1. About Your Organisation

**Company name:**
Devio Client

**Industry / sector:**
Software Development / AI Tooling

**Company size:**
N/A

---

## 2. The Problem You Want to Solve

**In 2–3 sentences, describe the core problem or opportunity:**
Le client souhaite intégrer directement les équipes Devio (via leurs personas et interfaces) dans l'IDE Antigravity. L'objectif est d'offrir une véritable interface graphique permettant de piloter l'agence IA sans quitter l'environnement de développement.

**Who experiences this problem?**
Les développeurs utilisant le framework Devio.

**What is the cost of NOT solving it?**
Une expérience utilisateur fragmentée et moins intégrée, limitant l'adoption et la productivité.

---

## 3. Your Vision of the Solution

**What do you imagine the solution looking like?**
Un plugin ou une extension native pour Antigravity IDE comprenant toutes les fonctionnalités MVP :
- Tableau de bord de projet
- Message bus / Inbox
- Chat avec les agents
- Éditeur de brief
- Visionneuse de livrables

**Are there existing systems this solution must integrate with?**
L'intégration doit pouvoir lire et écrire dans les fichiers du workspace (`agency_workspace`) ET communiquer directement avec l'API Antigravity.

**Are there systems it must NOT touch or replace?**
N/A.

---

## 4. Target Users

**Who will use this system?**
Les utilisateurs d'Antigravity IDE souhaitant exploiter l'agence Devio.

**Approximate number of users:**
N/A. Le package sera distribué manuellement.

**Technical proficiency of users:**
Développeurs.

---

## 5. Timeline & Budget

**When do you need this delivered?**
Dès que possible, implémentation MVP priorisée.

**Is there a hard deadline? (e.g., product launch, board demo, regulatory date)**
Non spécifié.

**Budget range (approximate):**
- [x] Budget illimité

---

## 6. Success Criteria

**How will you know this project is a success?**
1. L'agence Devio est entièrement pilotable depuis l'interface graphique dans Antigravity IDE.
2. Toutes les fonctionnalités MVP sont présentes et opérationnelles.
3. Les interactions avec l'API Antigravity fonctionnent correctement.

---

## 7. Constraints & Special Requirements

**Compliance / regulatory requirements:**
Aucune.

**Technology constraints:**
Doit s'intégrer de manière native dans l'environnement Antigravity IDE. Note: Le choix initial de faire un plugin VS Code a été écarté ("bad call") au profit d'Antigravity IDE directement. Les équipes doivent faire des recherches sur la façon de développer une telle intégration pour Antigravity IDE.

**Anything else we should know?**
Le livrable doit être distribuable manuellement (équivalent d'un .vsix).
