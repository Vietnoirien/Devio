# Devio Client — Proposition Commerciale : Antigravity IDE Plugin

**Préparé par :** Devio AI Development Agency (Morpheus)
**Date :** 2026-06-17
**Version :** 1.0

---

## Synthèse Exécutive

L'agence Devio propose de concevoir et de développer une intégration native (plugin) pour l'environnement de développement Antigravity IDE. Ce plugin offrira aux développeurs une interface graphique complète pour piloter les personas de l'agence Devio (CEO, Architect, Developer, QA) directement depuis leur IDE. L'objectif est d'éliminer le besoin d'éditer manuellement les fichiers de configuration, d'unifier l'expérience développeur et de maximiser la productivité grâce à une intégration fluide avec l'API Antigravity.

---

## Périmètre du Projet (Scope of Work)

### Inclus (MVP)
- **Tableau de bord de projet** : Visualisation en temps réel de la phase en cours, des tâches et des bloqueurs.
- **Message Bus / Inbox** : Interface de lecture et d'écriture pour le système de messages inter-agents (`inbox.jsonl`).
- **Chat avec les agents** : Panneau latéral interactif pour déclencher et communiquer avec les personas.
- **Éditeur de brief** : Formulaire guidé remplaçant l'édition manuelle de `01_brief.md`.
- **Visionneuse de livrables** : Interface de lecture pour les rapports d'architecture, propositions, etc.
- **Intégration API / Fichiers** : Lecture/écriture sur le système de fichiers (`agency_workspace/`) et communication directe avec l'API ou le SDK Antigravity.
- **Distribution** : Fourniture du package compilé (format .vsix ou équivalent) pour une installation manuelle.

### Exclu du périmètre
> [!IMPORTANT]
> Les éléments suivants ne sont explicitement **pas** inclus dans cet engagement. Toute modification du périmètre nécessitera un avenant écrit.

- Publication sur un Marketplace public.
- Support d'autres IDE (ex: VS Code classique, IntelliJ) — l'intégration est exclusive à Antigravity IDE.
- Outils d'analyse de code ou de télémétrie complexes hors du périmètre MVP.

---

## Feuille de Route (Roadmap)

### Phase 1 — Fondation & Intégration Antigravity
**Durée :** 2 semaines
**Objectif :** Établir la base du plugin et la connexion avec l'environnement Antigravity (API/Workspace).

| Livrable | Description | Critères d'acceptation |
|:---|:---|:---|
| Socle de l'extension | Boilerplate du plugin Antigravity (.vsix) | L'extension s'installe manuellement et s'active. |
| Gestionnaire de Workspace | Module de lecture/écriture pour `state.json`, `01_brief.md` et `inbox.jsonl` | Les modifications via l'UI sont reflétées dans les fichiers. |
| Connexion API | Pont de communication direct avec l'API Antigravity | Le plugin peut envoyer une commande à un agent Antigravity. |

---

### Phase 2 — Interfaces Graphiques (MVP)
**Durée :** 3 semaines
**Objectif :** Développer les vues UI interactives pour le pilotage de l'agence.

| Livrable | Description | Critères d'acceptation |
|:---|:---|:---|
| Tableau de bord | Vue principale affichant le statut du projet | Affichage correct de la phase courante et des bloqueurs. |
| Éditeur de Brief & Visionneuse | Interfaces dédiées pour la saisie et la lecture de livrables | Possibilité de modifier le brief via des formulaires. |
| Panneau de Chat / Inbox | Interface de messagerie latérale | Les messages sont envoyés aux bons agents et stockés. |

---

## Hypothèses

Les hypothèses suivantes sous-tendent cette proposition. Si l'une d'entre elles s'avère inexacte, le périmètre et les délais pourraient être révisés.

1. L'API ou le SDK d'Antigravity IDE permet bien les déclenchements de hooks et la communication bidirectionnelle comme identifié lors de notre phase de recherche.
2. Le client dispose des droits d'installation d'extensions personnalisées sur son instance d'Antigravity IDE.

---

## Risques

| Risque | Probabilité | Impact | Atténuation |
|:---|:---|:---|:---|
| API Antigravity non documentée / instable | Moyenne | Élevé | Utilisation d'un pont MCP ou de la manipulation directe du système de fichiers comme fallback robuste. |
| Limitations des Webviews dans l'IDE | Faible | Moyen | Conception d'UI minimalistes et éprouvées (similaires aux standards VS Code). |

---

## Résumé de l'Investissement

Veuillez consulter le fichier `02_quote.md` pour le devis détaillé. Le budget étant illimité pour garantir une réussite totale du MVP, nous avons provisionné une équipe senior dédiée.

| Phase | Durée | Coût Estimé |
|:---|:---|:---|
| Phase 1 — Fondation & Intégration | 2 semaines | 40 000 € |
| Phase 2 — Interfaces Graphiques | 3 semaines | 60 000 € |
| **Total** | **5 semaines** | **100 000 € HT** |

> Conditions de paiement : 30 % à la signature, 40 % à la livraison de la Phase 1, 30 % à la livraison finale.

---

## Prochaines Étapes

1. Validation et approbation de la proposition par le client.
2. Émission de la facture d'acompte.
3. Réunion de lancement (Kick-off).
4. Début de la Phase 1 (Architecture technique par l'agence).
