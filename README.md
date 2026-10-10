# MangaTrack

MangaTrack est une application web permettant de suivre ses mangas et anime, gérer sa progression et programmer des rappels.

Ce dépôt contient le MVP du projet réalisé dans le cadre du cours d’architecture logicielle.

## Fonctionnalités du MVP

- Consultation du catalogue
- Ajout d'une œuvre à la bibliothèque
- Protection contre les doublons dans la bibliothèque
- Consultation de la bibliothèque personnelle
- Suivi de la progression
- Persistance des données avec PostgreSQL
- Programmation de rappels
- Traitement asynchrone des rappels avec BullMQ et Redis
- Simulation de l'envoi d'e-mails
- Tests automatisés d'architecture

## Architecture

Le projet utilise une architecture de type monolithe modulaire avec une séparation inspirée des ports et adaptateurs.

```text
Frontend React
      |
      v
API Node.js / TypeScript
      |
      +---- Catalogue
      +---- Bibliothèque
      +---- Progression
      +---- Notifications
      |
      +---- PostgreSQL
      |
      +---- Redis / BullMQ
                |
                v
              Worker
                |
                v
        Adaptateur e-mail
```

Les dépendances techniques sont isolées derrière des ports afin de faciliter leur remplacement.

Exemples :

```text
CatalogPort
    |
FakeCatalogAdapter

NotificationQueuePort
    |
BullMqNotificationQueueAdapter

EmailPort
    |
FakeEmailAdapter
```

## Technologies

### Frontend

- React
- TypeScript
- Vite

### Backend

- Node.js
- TypeScript
- Express

### Infrastructure

- PostgreSQL
- Redis
- BullMQ
- Docker Compose

## Prérequis

Avant de lancer le projet :

- Node.js et npm
- Docker
- Docker Compose

## Installation

Cloner le dépôt :

```bash
git clone git@github.com:AlexTng44000/MangaTrack.git
cd MangaTrack
```

### Configuration du backend

Créer le fichier d'environnement :

```bash
cp backend/.env.example backend/.env
```

Le fichier peut contenir :

```env
DATABASE_URL=postgresql://mangatrack:mangatrack_dev@localhost:5432/mangatrack
```

Installer les dépendances :

```bash
cd backend
npm install
cd ..
```

### Configuration du frontend

Créer le fichier d'environnement :

```bash
cp frontend/.env.example frontend/.env
```

Le fichier peut contenir :

```env
VITE_API_URL=http://localhost:3000
```

Installer les dépendances :

```bash
cd frontend
npm install
cd ..
```

## Lancement du MVP

### 1. Démarrer PostgreSQL et Redis

Depuis la racine du projet :

```bash
docker compose up -d
```

Vérifier leur état :

```bash
docker compose ps
```

Les conteneurs suivants doivent être actifs :

```text
mangatrack-postgres
mangatrack-redis
```

### 2. Démarrer l'API

Dans un premier terminal :

```bash
cd backend
npm run dev
```

L'API est disponible sur :

```text
http://localhost:3000
```

Vérification :

```bash
curl http://localhost:3000/health
```

Réponse attendue :

```json
{
  "status": "ok",
  "application": "MangaTrack"
}
```

### 3. Démarrer le worker de notifications

Dans un deuxième terminal :

```bash
cd backend
npm run worker:notifications
```

Le terminal doit afficher :

```text
Worker notifications démarré
```

### 4. Démarrer le frontend

Dans un troisième terminal :

```bash
cd frontend
npm run dev
```

L'application est accessible sur :

```text
http://localhost:5173
```

## Utilisation

Depuis l'interface web, il est possible de :

```text
Catalogue
   |
   v
Ajouter une œuvre
   |
   v
Ma bibliothèque
   |
   v
Modifier la progression
```

L'onglet `Rappels` permet également de programmer une notification à une date et une heure futures.

Le traitement fonctionne ainsi :

```text
Frontend
   |
POST /notifications
   |
   v
BullMQ
   |
   v
Redis
   |
attente
   |
   v
Worker
   |
   v
E-mail simulé
```

Exemple dans le terminal du worker :

```text
[EMAIL SIMULÉ] À test@mangatrack.local
Le prochain épisode sort bientôt.
Notification 6 envoyée
```

## API principale

### Santé de l'application

```http
GET /health
```

### Catalogue

```http
GET /catalog
```

### Bibliothèque

```http
GET /library
```

Ajouter une œuvre :

```http
POST /library
```

Exemple :

```json
{
  "userId": 1,
  "catalogItemId": 1,
  "status": "a_commencer"
}
```

Une œuvre ne peut être ajoutée qu'une seule fois par utilisateur.

Une tentative de doublon renvoie :

```http
409 Conflict
```

### Progression

```http
PATCH /progress/:libraryEntryId
```

Exemple :

```json
{
  "progress": 5
}
```

### Notifications

```http
POST /notifications
```

Exemple :

```json
{
  "userId": 1,
  "email": "test@mangatrack.local",
  "message": "Le prochain épisode sort bientôt.",
  "scheduledAt": "2026-10-10T15:30:00+02:00"
}
```

## Tests

### Backend

Depuis `backend/` :

```bash
npm run typecheck
npm test
```

Les tests vérifient notamment que les modules métier ne dépendent pas directement de l'infrastructure ou des technologies comme BullMQ, Redis ou PostgreSQL.

### Frontend

Depuis `frontend/` :

```bash
npm run lint
npm run build
```

## Test du scénario de disponibilité des notifications

Le système de notifications permet de conserver les rappels lorsqu'aucun worker n'est disponible.

Pour le vérifier :

1. Arrêter le worker.
2. Créer une notification avec l'API ou le frontend.
3. La notification reste stockée dans Redis.
4. Relancer le worker.
5. Le rappel est automatiquement traité.

Cela permet de démontrer qu'une indisponibilité temporaire du worker ne provoque pas la perte du rappel.

## Structure simplifiée

```text
MangaTrack/
├── backend/
│   ├── src/
│   │   ├── infrastructure/
│   │   ├── integrations/
│   │   ├── modules/
│   │   ├── workers/
│   │   └── server.ts
│   └── test/
│
├── frontend/
│   └── src/
│       ├── api/
│       ├── pages/
│       └── types/
│
├── docs/
├── docker-compose.yml
└── README.md
```

## État du MVP

La tranche fonctionnelle actuelle permet de réaliser le parcours suivant :

```text
Consulter le catalogue
        ↓
Ajouter une œuvre
        ↓
Stockage PostgreSQL
        ↓
Consulter sa bibliothèque
        ↓
Modifier sa progression
        ↓
Programmer un rappel
        ↓
Stockage Redis / BullMQ
        ↓
Traitement par le worker
        ↓
Envoi simulé de la notification
```

Les services externes réels, notamment le fournisseur de catalogue et le fournisseur d'e-mails, sont actuellement remplacés par des adaptateurs simulés.