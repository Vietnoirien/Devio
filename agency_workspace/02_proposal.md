# Proposition de Projet — Devio Autonomous Agency Engine V3 (Intégration Native)

**Préparé pour :** Client Devio
**Préparé par :** Morpheus, Partenaire Client Principal — Devio
**Date :** 2026-06-18
**Version :** 3.0
**Engagement :** Plugin IDE Antigravity — Moteur d'Orchestration Autonome

---

## Résumé Exécutif

Suite à votre décision stratégique de choisir l'Option B, cette proposition décrit le plan d'intégration native des capacités de l'extension Antigravity Link directement dans le plugin Devio. 

Au lieu de dépendre d'un pont HTTP fragile vers une extension séparée, Devio intégrera les services sous-jacents du protocole Chrome DevTools (CDP). Cela donne au moteur d'orchestration Devio un contrôle natif et programmatique sur l'interface de chat de l'IDE Antigravity, une gestion robuste du multi-fenêtrage, et son propre serveur MCP intégré. Le résultat est une expérience premium avec un seul plugin qui pilote la boucle de l'agence de manière autonome sans aucune friction de configuration (pas de ports réseau, pas de tokens d'authentification).

---

## Périmètre d'Intervention

### Ce qui est inclus

- **Empaquetage Global de l'Agence** — les profils d'agents et les compétences (skills) sont empaquetés directement dans le plugin et installés de manière autonome dans le stockage global de l'éditeur (Global Storage), rendant l'agence Devio disponible depuis n'importe quel espace de travail.
- **Moteur d'Orchestration Natif** — un exécuteur de boucle intégré à l'hôte d'extension VS Code qui gère le cycle de vie complet des phases : BRIEF → RESEARCH → PROPOSAL → ARCHITECTURE → DEVELOPMENT → REVIEW → DELIVERY → DONE.
- **Intégration CDP Native** — intégration directe de `cdp.ts` et des services associés depuis le fork. Le moteur communique directement avec la couche UI de l'IDE, éliminant le polling HTTP.
- **Gestion des Fenêtres** — évaluation intelligente et ciblage pour gérer les multiples instances d'Antigravity IDE de manière fluide.
- **Prompt Builder & Workspace Writer** — assemble le contexte du système, les tâches des agents, et applique les sorties des agents de manière atomique aux fichiers de l'espace de travail.
- **ConversationManager** — s'assure que chaque tour d'agent s'exécute dans un contexte propre pour éviter la contamination croisée entre les rôles (ex: contexte Chercheur vs contexte Développeur).
- **Deux Paramètres Utilisateur** (Paramètres VS Code) :
  - `devio.autonomyMode` — `"full"` (autonome jusqu'à DONE) ou `"supervised"` (pause à chaque transition de phase pour votre approbation).
  - `devio.freshConversationPerTurn` — booléen (par défaut : `true`). Sa désactivation accumule tous les tours dans une seule session.
- **Serveur MCP Intégré** — le plugin Devio inclura et exposera `mcp-server.mjs` de manière native.
- **Mises à jour en direct de la webview** — le tableau de bord existant reflète la progression du moteur en temps réel.

### Ce qui N'est PAS inclus

- Une nouvelle refonte de l'interface de la webview (le tableau de bord existant est conservé et étendu).
- L'intégration avec des API LLM externes (OpenAI, Anthropic, etc.) — le moteur pilote uniquement votre session Antigravity active.
- L'automatisation de la sélection du modèle — le modèle utilisé est celui qui est actif dans votre session Antigravity.

---

## Feuille de Route par Phases

### Phase 1 — Fondation : Intégration CDP Native

**Objectif :** Fusionner les services CDP du fork dans Devio et établir une communication native fiable avec la fenêtre de chat de l'IDE.

**Durée :** 1 semaine

**Livrables Clés :**
- Fusion de `src/services/` et `src/server/` du fork dans l'architecture de Devio.
- Classe `NativeBridge` exposant `captureSnapshot()`, `injectMessage()`, et `connectCDP()` directement au moteur.
- `ConversationManager` implémenté via des commandes CDP natives (ex: clic sur "New Chat").
- Enregistrement des paramètres : `devio.autonomyMode`, `devio.freshConversationPerTurn`.

**Critères d'Acceptation :**
- Le plugin peut lire et écrire nativement dans la session Antigravity active sans serveur HTTP externe.
- La gestion des fenêtres identifie et cible correctement l'interface de chat active.

---

### Phase 2 — Cœur : Prompt Builder & Workspace Writer

**Objectif :** Construire les composants d'intelligence qui assemblent les prompts et appliquent les sorties des agents.

**Durée :** 1 semaine

**Livrables Clés :**
- `PromptBuilder` — lit SKILL.md et les fichiers de l'espace de travail.
- `WorkspaceWriter` — analyse les blocs balisés dans les réponses des agents et met à jour de manière atomique les fichiers et `inbox.jsonl`.
- Tests d'intégration simulant les réponses CDP.

**Critères d'Acceptation :**
- À partir d'une phase et d'un ensemble de fichiers, `PromptBuilder` produit un prompt de contexte complet.
- `WorkspaceWriter` applique correctement les créations de fichiers, les modifications, et les ajouts de messages.

---

### Phase 3 — Orchestrateur : La Boucle

**Objectif :** Assembler la boucle du moteur qui enchaîne les phases de manière autonome.

**Durée :** 1 semaine

**Livrables Clés :**
- `OrchestrationEngine` — lit `state.json`, active la phase correcte, pilote le `NativeBridge`, et avance l'état.
- UI d'approbation pour le mode supervisé dans la webview.
- Gestion des erreurs et chemins d'escalade.

**Critères d'Acceptation :**
- En mode `full` : l'agence s'exécute de bout en bout sans intervention humaine.
- En mode `supervised` : pause aux limites de phase pour approbation.

---

### Phase 4 — Polissage, MCP & Livraison Globale

**Objectif :** Renforcer le moteur, exposer le serveur MCP, implémenter l'installation globale des ressources de l'agence et empaqueter le plugin final.

**Durée :** 1 semaine

**Livrables Clés :**
- Intégrer et empaqueter `mcp-server.mjs`.
- Implémentation du système d'installation globale (copie des dossiers `agents` et `skills` vers `globalStorageUri`) via des mises à jour spécifiques des chemins dans `src/extension.ts` (pour l'initialisation) et `src/prompt-builder.ts` (pour charger les compétences et prompts depuis le stockage global plutôt que l'espace de travail).
- Tests unitaires et d'intégration complets.
- Paquet `.vsix` livrable.

**Critères d'Acceptation :**
- L'audit QA passe sans découverte CRITICAL ou HIGH.
- Le serveur MCP intégré est accessible et fonctionnel.
- Le `.vsix` s'installe proprement et fonctionne comme une solution autonome.

---

## Hypothèses et Risques

| # | Élément | Type | Atténuation |
|:--|:-----|:-----|:-----------|
| 1 | Antigravity IDE est lancé avec `--remote-debugging-port` | Hypothèse | Le bilan de santé du plugin le détecte et affiche des instructions de lancement claires s'il est manquant. |
| 2 | Les sélecteurs DOM CDP peuvent changer dans les futures mises à jour de l'IDE | **RISQUE — Moyen** | L'Architecte concevra une configuration de mappage des sélecteurs résiliente qui peut être mise à jour sans changements majeurs du moteur. |
| 3 | La sélection du modèle est hors du contrôle du plugin | **RISQUE — Faible** | Documenté comme une limitation connue ; l'utilisateur sélectionne manuellement le modèle avant exécution. |

---

## Résumé de l'Investissement

| Phase | Périmètre | Durée | Effort |
|:------|:------|:---------|:-------|
| 1 — Intégration CDP Native | Fusion des services, Gestion des Fenêtres, NativeBridge | 1 semaine | Élevé |
| 2 — Cœur Prompt & Workspace | PromptBuilder, WorkspaceWriter | 1 semaine | Élevé |
| 3 — Boucle Orchestrateur | Machine à États, UI Supervisée | 1 semaine | Élevé |
| 4 — Polissage & Livraison MCP | Tests, Intégration MCP, Empaquetage | 1 semaine | Moyen |
| **Total** | | **4 semaines** | |

**Budget :** Illimité (selon confirmation du client).
**Calendrier :** 4 semaines à partir de l'approbation de l'Architecture.
