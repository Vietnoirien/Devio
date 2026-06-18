# Addendum à la Proposition — Enrichissement de l'Interaction Agent (V2)

**Préparé par :** Devio AI Development Agency (Morpheus)
**Date :** 2026-06-17
**Version :** 1.1

---

## Le Constat

Suite à vos retours pertinents concernant la livraison initiale, nous reconnaissons que l'extension actuelle offre une expérience de consultation passive (lecture des fichiers JSON) sans interaction directe avec les agents. L'absence de recherche approfondie sur l'API Antigravity lors de la phase initiale a conduit à une approche "fichier-centric" qui limite l'expérience utilisateur et ne respecte pas pleinement la vision discutée.

Cet addendum vise à rectifier cette lacune en proposant des options pour intégrer une véritable interaction avec l'agence Devio, permettant d'envoyer des messages, de démarrer l'agence et de la piloter directement depuis l'interface.

---

## Options d'Enrichissement Proposées

Pour doter l'extension d'une capacité d'interaction avec les agents, nous proposons deux approches :

### Option 1 : Intégration via Terminal / CLI (Recommandée pour un MVP rapide)
- **Concept :** L'interface de l'extension permet à l'utilisateur de saisir un message. Le plugin écrit ce message dans `inbox.jsonl`, puis génère et exécute automatiquement une commande dans le terminal intégré de l'IDE (ex: `antigravity --run-skill agency-coordinator`) pour réveiller l'agence.
- **Avantages :** Implémentation très rapide et robuste. Elle réutilise les mécanismes natifs d'Antigravity IDE et le workflow existant de l'agence.
- **Expérience Utilisateur :** Transparente pour l'utilisateur, qui interagit via le panneau de Chat, tandis que l'IDE orchestre le démarrage en arrière-plan.

### Option 2 : Intégration Profonde par API / Inter-Process Communication
- **Concept :** Utilisation avancée du SDK natif d'Antigravity pour instancier les agents en mémoire, permettant une communication directe bidirectionnelle (IPC) sans passer par des commandes CLI visibles.
- **Avantages :** Expérience plus fluide, architecture plus élégante, gestion d'état et de cycle de vie plus granulaire.
- **Inconvénients :** Nécessite une recherche technique approfondie sur le fonctionnement interne de l'API agentique d'Antigravity pour valider la faisabilité technique.

---

## Prochaines Étapes : Relance de la Phase de Recherche

Afin de garantir le succès de cette intégration et de ne plus faire d'approximations techniques, **je mets en pause la clôture du projet et relance officiellement une phase de RECHERCHE.**

1. **Recherche ciblée :** J'ai ordonné à notre Chercheur (Researcher) de documenter précisément la manière d'envoyer des requêtes ou des commandes à un agent au sein de l'environnement Antigravity (que ce soit via CLI ou via API).
2. **Architecture V2 :** Une fois la faisabilité validée, l'Architecte mettra à jour la spécification (`03_architecture.md`) pour inclure le mécanisme d'envoi de messages.
3. **Développement :** L'équipe de développement implémentera le panneau de Chat interactif et le pont de communication.

Nous reviendrons vers vous avec les résultats de cette recherche très prochainement.
