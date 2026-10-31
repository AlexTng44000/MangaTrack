# MyMangaTracker

MyMangaTracker est une application web permettant de suivre ses mangas et anime, gérer sa progression, découvrir de nouvelles œuvres et organiser son visionnage ou sa lecture.

Le projet a été réalisé dans le cadre du cours d’architecture logicielle en M1 à l’ESGI.

L’objectif est de proposer une application fonctionnelle tout en mettant en œuvre une architecture modulaire, des ports et adaptateurs, des traitements asynchrones et plusieurs scénarios de qualité.

## Nouvelle interface

Le site s’appelle désormais **MyMangaTracker**. L’accueil réunit le catalogue et la bibliothèque avec des filtres de recherche, de type, de genre, de statut et de favoris. Le suivi, le plan de rattrapage et les rappels sont accessibles directement sur les fiches manga/anime. L’interface propose le français et l’anglais, avec une préférence conservée sur l’appareil, et une navigation adaptée au mobile.

Pour une base PostgreSQL existante, appliquer la migration avant de lancer cette version du backend :

```bash
docker compose exec -T postgres psql -U mangatrack -d mangatrack -v ON_ERROR_STOP=1 -f - < backend/src/infrastructure/database/migrations/20261031_reminder_work.sql
```

Les nouvelles bases incluent cette colonne dans `init.sql`. Les rappels existants sont conservés ; seuls les nouveaux rappels créés depuis une fiche ou le calendrier sont associés à une œuvre. L’historique global reste accessible depuis les fiches.

Tests de l’interface :

```bash
cd frontend
npm ci
# Si aucun Chromium compatible n’est disponible :
npx playwright install chromium
npm run test:ui
```

Les tests navigateur utilisent des réponses API simulées pour être indépendants d’AniList et de la base. Ils couvrent les filtres, le suivi, les rappels, les langues, les anciennes URL et les écrans de 320 à 1 440 pixels. La compilation et le lint restent disponibles avec `npm run build` et `npm run lint`. Les synopsis et titres issus d’AniList restent dans la langue fournie par la source.

---

## Fonctionnalités

### Authentification

- Création de compte
- Connexion
- Authentification par JWT
- Gestion des rôles `user` et `admin`
- Protection des routes privées
- Gestion automatique des sessions expirées côté frontend

### Catalogue

- Catalogue manga et anime basé sur AniList
- Recherche par titre
- Pagination
- Filtrage par type
- Filtrage par genre
- Fiche détaillée d’une œuvre
- Synopsis
- Nombre d’épisodes ou de chapitres
- Score AniList
- Statut
- Format
- Année de diffusion
- Relations entre œuvres

Le catalogue utilise l’API GraphQL publique d’AniList.

### Bibliothèque personnelle

Chaque utilisateur dispose de sa propre bibliothèque.

Il est possible de :

- ajouter une œuvre ;
- supprimer une œuvre ;
- modifier son statut ;
- suivre sa progression ;
- ajouter une œuvre aux favoris ;
- attribuer une note sur 10 ;
- consulter ses mangas et anime suivis.

Les statuts disponibles sont :

```text
À commencer
En cours
Terminé
Abandonné
```

Une même œuvre ne peut apparaître qu’une seule fois dans la bibliothèque d’un utilisateur.

### Progression

MangaTrack permet de suivre :

- les épisodes vus pour un anime ;
- les chapitres lus pour un manga.

Le nombre total disponible est récupéré depuis AniList lorsqu’il est connu.

### Relations manga / anime

Les relations entre œuvres sont récupérées depuis AniList.

MangaTrack peut notamment afficher :

```text
Adaptation
Suite
Préquelle
Spin-off
Histoire parallèle
Version alternative
Résumé
```

Les adaptations manga / anime sont mises en avant séparément.

### Point de reprise anime → manga

Lorsqu’un anime possède une adaptation manga, l’utilisateur peut enregistrer manuellement le chapitre à partir duquel il souhaite reprendre sa lecture.

Exemple :

```text
Attack on Titan - Anime
        ↓
Attack on Titan - Manga
        ↓
Reprendre au chapitre 34
```

Le point de reprise est conservé dans PostgreSQL.

La correspondance épisode → chapitre n’est pas inventée automatiquement : AniList ne fournit pas systématiquement cette information précise.

### Calendrier des sorties

MangaTrack récupère les prochaines sorties d’épisodes via AniList.

Le calendrier indique notamment :

- le titre ;
- le numéro d’épisode ;
- la date ;
- l’heure ;
- le format ;
- l’image de couverture.

Depuis le calendrier, l’utilisateur peut également créer un rappel.

### Rappels

Les utilisateurs peuvent programmer des rappels.

Un rappel contient :

```text
Message
Date / heure
Statut
```

Statuts possibles :

```text
pending
sent
failed
cancelled
```

Les rappels sont persistés dans PostgreSQL et planifiés avec BullMQ.

Ils peuvent être annulés tant qu’ils n’ont pas encore été traités.

### Traitement asynchrone

Le traitement des rappels repose sur :

```text
API
 |
 v
PostgreSQL
 |
 v
BullMQ
 |
 v
Redis
 |
 v
Worker
 |
 v
Adaptateur e-mail
```

Le fournisseur d’e-mail est actuellement simulé avec un `FakeEmailAdapter`.

Cela permet de tester l’architecture sans dépendre d’un service d’e-mail externe.

### Recommandations personnalisées

MangaTrack génère des recommandations à partir de la bibliothèque de l’utilisateur.

Le système analyse notamment :

- les genres des œuvres suivies ;
- les favoris ;
- les notes attribuées ;
- les œuvres terminées.

Les favoris et les œuvres bien notées ont davantage de poids dans le calcul.

Les œuvres déjà présentes dans la bibliothèque sont exclues des recommandations.

### Statistiques

Une page de statistiques permet de consulter :

- nombre total d’œuvres suivies ;
- nombre de favoris ;
- nombre d’œuvres notées ;
- note moyenne ;
- nombre d’anime suivis ;
- nombre d’épisodes vus ;
- nombre de mangas suivis ;
- nombre de chapitres lus ;
- répartition des œuvres selon leur statut.

### Plan de rattrapage

MangaTrack peut calculer un rythme de visionnage ou de lecture à partir d’une date cible.

L’utilisateur choisit :

```text
Une œuvre
+
Une date cible
```

L’application calcule ensuite :

- le nombre d’épisodes ou chapitres restants ;
- le nombre de jours disponibles ;
- le rythme quotidien nécessaire ;
- une estimation du rythme hebdomadaire.

Exemple :

```text
25 épisodes restants
4 jours disponibles

→ environ 7 épisodes par jour
```

### Administration

Un utilisateur possédant le rôle `admin` peut accéder à une interface d’administration.

Elle permet notamment de consulter les utilisateurs inscrits.

Les mots de passe et les hash de mots de passe ne sont jamais exposés par l’API.

---

# Architecture

MangaTrack utilise un **monolithe modulaire** avec une organisation inspirée des **ports et adaptateurs**.

L’objectif est de séparer :

- la logique métier ;
- les interfaces ;
- les intégrations externes ;
- les technologies d’infrastructure.

Architecture simplifiée :

```text
                     Frontend React
                           |
                           v
                 API Node.js / Express
                           |
        +------------------+------------------+
        |                  |                  |
        v                  v                  v
     Catalogue         Bibliothèque       Utilisateurs
        |                  |                  |
        |                  |                  |
        +------------------+------------------+
                           |
                 Services applicatifs
                           |
             +-------------+-------------+
             |                           |
             v                           v
          Ports                       Ports
             |                           |
        +----+-----+                +----+------+
        |          |                |           |
        v          v                v           v
    PostgreSQL   Redis          AniList       BullMQ
                                             |
                                             v
                                           Worker
                                             |
                                             v
                                       Adaptateur e-mail
```

---

## Ports et adaptateurs

Les modules métier ne connaissent pas directement les technologies utilisées.

Exemples :

```text
CatalogPort
   |
   +-- AniListCatalogAdapter
   |
   +-- FakeCatalogAdapter
```

```text
LibraryRepository
   |
   +-- PostgresLibraryRepository
```

```text
NotificationQueuePort
   |
   +-- BullMqNotificationQueueAdapter
```

```text
EmailPort
   |
   +-- FakeEmailAdapter
```

Cette organisation facilite le remplacement d’une technologie sans modifier la logique métier.

---

# Cache du catalogue

Redis est également utilisé comme cache pour le catalogue AniList.

Le principe est :

```text
Frontend
   |
   v
Backend
   |
   v
Cache Redis
   |
   +---- donnée récente → utilisée directement
   |
   +---- donnée absente → appel AniList
                          |
                          v
                       cache Redis
```

Une donnée plus ancienne peut également être conservée temporairement afin de disposer d’un fallback en cas d’indisponibilité d’AniList.

---

# Technologies

## Frontend

- React
- TypeScript
- React Router
- Vite
- CSS

## Backend

- Node.js
- TypeScript
- Express
- Zod

## Sécurité

- JWT
- bcrypt

## Infrastructure

- PostgreSQL
- Redis
- BullMQ
- Docker Compose

## Service externe

- AniList GraphQL API

---

# Structure du projet

```text
MangaTrack/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── infrastructure/
│   │   │   ├── database/
│   │   │   ├── queue/
│   │   │   └── redis/
│   │   │
│   │   ├── integrations/
│   │   │   ├── catalog/
│   │   │   ├── email/
│   │   │   └── security/
│   │   │
│   │   ├── modules/
│   │   │   ├── catalog/
│   │   │   ├── library/
│   │   │   ├── notifications/
│   │   │   ├── progress/
│   │   │   ├── reminders/
│   │   │   └── users/
│   │   │
│   │   ├── workers/
│   │   └── server.ts
│   │
│   └── test/
│
├── frontend/
│   └── src/
│       ├── api/
│       ├── auth/
│       ├── pages/
│       ├── types/
│       ├── App.tsx
│       └── App.css
│
├── docs/
├── docker-compose.yml
└── README.md
```

---

# Prérequis

Pour lancer MangaTrack :

- Node.js
- npm
- Docker
- Docker Compose

---

# Installation

Cloner le dépôt :

```bash
git clone git@github.com:AlexTng44000/MangaTrack.git
cd MangaTrack
```

Installer les dépendances du backend :

```bash
cd backend
npm install
cd ..
```

Installer les dépendances du frontend :

```bash
cd frontend
npm install
cd ..
```

---

# Configuration

## Backend

Créer le fichier d’environnement si nécessaire :

```bash
cp backend/.env.example backend/.env
```

Exemple de connexion PostgreSQL :

```env
DATABASE_URL=postgresql://mangatrack:mangatrack_dev@localhost:5432/mangatrack
```

Le backend utilise également l’URL de l’API AniList configurée dans l’environnement.

## Frontend

Créer le fichier :

```bash
cp frontend/.env.example frontend/.env
```

Exemple :

```env
VITE_API_URL=http://localhost:3354
```

---

# Lancement

## 1. PostgreSQL et Redis

Depuis la racine :

```bash
docker compose up -d
```

Vérifier :

```bash
docker compose ps
```

Les services suivants doivent notamment être actifs :

```text
mangatrack-postgres
mangatrack-redis
```

---

## 2. Backend

Dans un terminal :

```bash
cd backend
npm run dev
```

L’API démarre sur :

```text
http://localhost:3354
```

Vérification :

```bash
curl http://localhost:3354/health
```

Réponse attendue :

```json
{
  "status": "ok",
  "application": "MangaTrack"
}
```

---

## 3. Worker de notifications

Dans un deuxième terminal :

```bash
cd backend
npm run worker:notifications
```

Le worker traite les rappels planifiés avec BullMQ.

---

## 4. Frontend

Dans un troisième terminal :

```bash
cd frontend
npm run dev
```

L’application est ensuite disponible sur :

```text
http://localhost:5173
```

---

# API principale

## Santé

```http
GET /health
```

---

## Authentification

Inscription :

```http
POST /auth/register
```

Connexion :

```http
POST /auth/login
```

Utilisateur courant :

```http
GET /auth/me
Authorization: Bearer <token>
```

---

## Catalogue

Catalogue :

```http
GET /catalog
```

Recherche et filtres :

```http
GET /catalog?search=attack&type=anime&genre=Action&page=1
```

Récupération de plusieurs œuvres :

```http
GET /catalog/by-ids?ids=16498,53390
```

Calendrier :

```http
GET /catalog/calendar
```

Fiche détaillée :

```http
GET /catalog/:id
```

Exemple :

```http
GET /catalog/16498
```

---

## Bibliothèque

Toutes les routes de bibliothèque nécessitent un JWT.

Liste :

```http
GET /library
Authorization: Bearer <token>
```

Ajout :

```http
POST /library
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "catalogItemId": 16498,
  "status": "a_commencer"
}
```

Le `userId` n’est jamais fourni par le client : il est récupéré depuis le JWT.

Suppression :

```http
DELETE /library/:id
```

Statut :

```http
PATCH /library/:id/status
```

```json
{
  "status": "en_cours"
}
```

Favori :

```http
PATCH /library/:id/favorite
```

```json
{
  "isFavorite": true
}
```

Note :

```http
PATCH /library/:id/rating
```

```json
{
  "rating": 8
}
```

Point de reprise :

```http
PATCH /library/:id/resume
```

```json
{
  "resumeCatalogItemId": 53390,
  "resumeChapter": 34
}
```

Pour supprimer le point de reprise :

```json
{
  "resumeCatalogItemId": null,
  "resumeChapter": null
}
```

---

## Progression

```http
PATCH /progress/:libraryEntryId
```

Exemple :

```json
{
  "progress": 12
}
```

---

## Rappels

Liste :

```http
GET /reminders
```

Création :

```http
POST /reminders
```

Exemple :

```json
{
  "message": "Nouvel épisode disponible",
  "scheduledAt": "2026-10-20T18:00:00+02:00"
}
```

Annulation :

```http
DELETE /reminders/:id
```

Les rappels sont liés automatiquement à l’utilisateur authentifié.

---

## Administration

```http
GET /admin/users
Authorization: Bearer <token-admin>
```

Un utilisateur non administrateur reçoit :

```http
403 Forbidden
```

---

# Sécurité

MangaTrack applique plusieurs mécanismes de sécurité.

## Mots de passe

Les mots de passe sont hashés avec bcrypt avant leur stockage.

Le mot de passe et son hash ne sont jamais renvoyés par l’API.

## JWT

Les JWT contiennent uniquement les informations nécessaires :

```text
userId
role
```

## Isolation utilisateur

Les opérations sensibles utilisent toujours l’utilisateur issu du JWT.

Par exemple :

```text
id de l’entrée
+
userId issu du JWT
```

Cela empêche un utilisateur de modifier directement une entrée appartenant à un autre compte.

## Administration

L’accès à l’administration nécessite :

```text
JWT valide
+
role = admin
```

---

# Tests

## Backend

Depuis `backend/` :

```bash
npm run typecheck
npm test
```

Les tests couvrent notamment :

- respect des frontières architecturales ;
- absence de dépendances techniques directes dans les modules métier ;
- gestion du point de reprise ;
- validation des erreurs métier ;
- transmission du `userId` ;
- authentification requise ;
- JWT invalide ;
- JWT valide ;
- accès administrateur ;
- refus d’un utilisateur non administrateur.

À l’état actuel du projet :

```text
18 tests
18 réussis
0 échec
```

---

## Frontend

Depuis `frontend/` :

```bash
npm run lint
npm run build
```

Ces commandes permettent notamment de vérifier :

- ESLint ;
- TypeScript ;
- compilation React ;
- build Vite de production.

---

# Scénario de résilience des rappels

BullMQ permet de dissocier la création d’un rappel de son traitement.

Exemple :

```text
1. Le worker est arrêté.
2. L’utilisateur programme un rappel.
3. Le rappel est persisté.
4. Le job reste en attente dans Redis / BullMQ.
5. Le worker est redémarré.
6. Le rappel est traité.
```

Une indisponibilité temporaire du worker ne provoque donc pas la perte immédiate du rappel.

---

# Scénario de résilience du catalogue

Le catalogue est protégé par un cache Redis.

Le principe est :

```text
AniList disponible
      |
      v
récupération des données
      |
      v
cache Redis
```

En cas de problème temporaire avec AniList, une donnée précédemment mise en cache peut être utilisée comme fallback.

Cela limite l’impact d’une indisponibilité du fournisseur externe.

---

# État actuel

MangaTrack permet actuellement de réaliser le parcours suivant :

```text
Créer un compte
      ↓
Se connecter
      ↓
Parcourir AniList
      ↓
Ajouter des œuvres à sa bibliothèque
      ↓
Gérer statut / progression / favoris / notes
      ↓
Consulter les sorties à venir
      ↓
Programmer des rappels
      ↓
Obtenir des recommandations
      ↓
Consulter ses statistiques
      ↓
Voir les relations manga / anime
      ↓
Enregistrer un point de reprise manga
      ↓
Créer un plan de rattrapage
```

Le projet met ainsi en œuvre à la fois des fonctionnalités utilisateur et plusieurs principes d’architecture logicielle :

- monolithe modulaire ;
- ports et adaptateurs ;
- isolation de l’infrastructure ;
- persistance PostgreSQL ;
- cache Redis ;
- traitement asynchrone BullMQ ;
- API externe AniList ;
- authentification JWT ;
- contrôle des rôles ;
- tests automatisés.