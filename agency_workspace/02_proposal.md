# Proposition Client Devio — Intégration de l'Agent RH Trinity

**Préparé par :** Agence de Développement IA Devio
**Date :** 2026-06-19
**Version :** 2.1

---

## Résumé Exécutif

Devio propose d'intégrer un nouveau membre d'équipe RH, Trinity, dans le flux de travail automatisé de l'agence. Trinity analysera de manière autonome le bus de messages `inbox.jsonl` pour extraire des informations de performance exploitables, suivre les temps de cycle de développement et identifier les inefficacités du flux de travail. Cette intégration permettra une optimisation continue des processus et des analyses d'équipe objectives grâce à des rapports structurés au niveau de l'Entreprise et des Agents. De plus, nous mettrons en place un routage dynamique des insights (informations) via le stockage global de l'éditeur (`globalStorageUri`), garantissant que chaque agent reçoive ses propres évaluations de performance et que les insights de l'entreprise soient dirigés vers les rôles stratégiques (Coordinateur et PDG), le tout en conservant une approche agnostique vis-à-vis du système.

---

## Périmètre du Projet (Scope of Work)

### Inclus dans le périmètre
- Création du profil d'agent `agency-trinity` avec un fichier `SKILL.md` dédié, axé sur l'analyse de données et les retours RH.
- Utilisation d'outils natifs intégrés (ex: `view_file`, `grep_search`) pour permettre à Trinity de lire et d'interroger `inbox.jsonl` de manière autonome, éliminant le besoin d'un script d'analyse personnalisé.
- Génération de deux niveaux distincts d'informations de performance structurées : au niveau de l'Entreprise (`agency_performance.md`) et au niveau de l'Agent (`{nom_agent}_performance.md`).
- Établissement d'un stockage local persistant pour les insights dans le dossier global du plugin (`globalStorageUri/.agent/insights/`).
- **Résolution dynamique des insights spécifiques aux agents via `globalStorageUri` afin de garantir une architecture agnostique du système.**
- **Routage ciblé des insights de l'entreprise (`agency_performance.md`) spécifiquement vers le coordinateur (`agency-coordinator`) et le PDG (`agency-ceo`) pour la planification stratégique.**
- Extension de l'interface utilisateur (React Webview) pour inclure un onglet "Company Insights" pour les utilisateurs et un gestionnaire "Agent/Company Insights" pour visualiser et modifier les rapports.
- Application de contraintes strictes sur la taille des fichiers (ex. maximum 500 lignes, journalisation glissante ou stratégie de troncature) sur les documents générés afin d'éviter l'épuisement de la fenêtre de contexte du LLM.
- Mise à jour de la logique de routage du `agency-coordinator` pour invoquer correctement Trinity lors de déclencheurs explicites : Analyse post-mortem (fin de cycle), Intervention en cas d'escalade/blocage, et Audits périodiques en arrière-plan.

### Hors périmètre
> [!IMPORTANT]
> Les éléments suivants ne sont explicitement **pas** inclus dans cet engagement. Toute modification du périmètre nécessitera un avenant écrit.

- Interventions RH en temps réel ou blocages pendant le développement actif du code.
- Analyse sémantique profonde du code réellement produit (cela reste la responsabilité de l'AQ).
- Modifications des modèles LLM sous-jacents utilisés par les agents.

---

## Déclencheurs Opérationnels et Routage

Trinity fonctionnera strictement selon trois déclencheurs de routage définis pour maximiser la coopération inter-agents et mettre en œuvre une boucle de réflexion et de critique (SOTA) :

1. **Analyse Post-Mortem (Fin de cycle) :** Lors du passage à la phase `DONE`, le Coordinateur assigne une tâche à Trinity pour analyser le cycle terminé, calculer les métriques et mettre à jour les documents d'insight.
2. **Intervention en cas d'Escalade / Blocage :** Si une friction excessive est détectée (ex. >3 messages `REQUEST_CHANGE` consécutifs), le Coordinateur interrompt temporairement la phase et fait appel à Trinity pour diagnostiquer la rupture de communication et fournir des retours exploitables.
3. **Audit Périodique en Arrière-plan :** En fonctionnement continu, Trinity s'exécute de manière asynchrone pour identifier les violations de protocole et les signaler pour une correction immédiate par le Coordinateur.

---

## Feuille de Route par Phases

### Phase 1 — Infrastructure d'Interface Utilisateur et de Stockage
**Durée :** 1 semaine
**Objectif :** Développer le mécanisme de stockage local et les composants de l'interface Webview pour les insights, ainsi que le routage dynamique.

| Livrable | Description | Critères d'acceptation |
|:---|:---|:---|
| Stockage des Insights & Troncature | Mécanisme de stockage local dans `globalStorageUri/.agent/insights/` avec des contraintes strictes de taille de fichier. | L'accès persistant en lecture/écriture est établi ; les fichiers générés respectent strictement les limites de taille définies. |
| Routage Dynamique des Insights | Intégration dans `prompt-builder.ts` pour résoudre dynamiquement les chemins des insights (`globalStorageUri`) par agent, et router les insights globaux vers le Coordinateur et le PDG. | Chaque agent reçoit son fichier d'insight, et seul le Coordinateur/PDG reçoivent `agency_performance.md`, de manière indépendante du système. |
| Intégration de l'Interface Webview | Ajout d'un onglet "Company Insights" et d'un "Gestionnaire d'Insights" pour visualiser et modifier nativement les données. | Les utilisateurs peuvent consulter et gérer les insights de l'entreprise et des agents directement depuis l'interface React. |

---

### Phase 2 — Intégration de Trinity & du Coordinateur
**Durée :** 1 semaine
**Objectif :** Intégrer l'agent Trinity et mettre à jour la logique d'orchestration.

| Livrable | Description | Critères d'acceptation |
|:---|:---|:---|
| Compétence `agency-trinity` | Fichier d'instructions dédié pour le profil RH. | Trinity utilise avec succès les outils natifs pour lire `inbox.jsonl` et générer des rapports structurés. |
| Mises à jour du Coordinateur | Règles de routage affinées pour le `agency-coordinator`. | Le Coordinateur route sans problème le travail vers Trinity en se basant sur les trois déclencheurs explicites. |

---

## Hypothèses

Les hypothèses suivantes sous-tendent cette proposition. Si l'une de ces hypothèses s'avère inexacte, la portée et le calendrier pourraient devoir être révisés.

1. La structure de `inbox.jsonl` reste cohérente et analysable selon le schéma du protocole de bus de messages existant.
2. L'intégration actuelle de Antigravity Link supporte la légère surcharge d'un tour d'agent supplémentaire au cours du cycle de vie du projet.

---

## Risques

| Risque | Probabilité | Impact | Atténuation |
|:---|:---|:---|:---|
| Épuisement de la fenêtre de contexte du LLM | Élevée | Élevé | Trinity appliquera strictement des limites de taille de fichier sur les documents d'insight générés. L'agent utilisera des outils intégrés plutôt que d'ingérer des fichiers entiers. |
| Goulots d'étranglement de l'Orchestration | Moyenne | Moyen | Le Coordinateur sera programmé pour n'invoquer Trinity que lors des déclencheurs définis afin d'éviter les retards de livraison. |

---

## Résumé de l'Investissement

| Phase | Durée | Coût Estimé |
|:---|:---|:---|
| Phase 1 — Infrastructure d'Interface Utilisateur et de Stockage | 1 semaine | Couvert par le budget ouvert |
| Phase 2 — Intégration de Trinity | 1 semaine | Couvert par le budget ouvert |
| **Total** | **2 semaines** | **Illimité (selon le brief client)** |

> Conditions de paiement : Acompte de 30% à la signature, 40% à l'achèvement de la Phase 1, 30% lors de la livraison finale.

---

## Prochaines Étapes

1. Le Client examine et approuve cette proposition.
2. L'Architecte vérifie la faisabilité technique du nouveau routage du Coordinateur, de l'architecture de l'interface utilisateur, et du routage dynamique des insights via `globalStorageUri`.
3. La Phase 1 commence immédiatement après approbation.

---

*Cette proposition est valable 30 jours à compter de sa date d'émission.*
