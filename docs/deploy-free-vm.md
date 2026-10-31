# Mettre MyMangaTracker en ligne sur une VM

Le dépôt contient une configuration de production distincte du développement local : site Vite compilé servi par Caddy, API Node compilée, PostgreSQL et Redis privés, volumes persistants, migrations idempotentes et worker e-mail optionnel. Le navigateur appelle `/api` sur la même origine que le site : aucune URL localhost n’est envoyée aux visiteurs.

## 1. Créer le compte et la VM

L’ouverture du compte doit être effectuée par le propriétaire : l’agent ne peut pas réaliser la vérification d’identité/de carte à sa place. Ne jamais envoyer de clé privée SSH, mot de passe ou numéro de carte dans le chat.

[Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/) est une piste pour une VM Always Free. Les capacités disponibles et conditions évoluent : choisir uniquement une instance et un stockage explicitement affichés gratuits dans la console, vérifier l’estimation avant création, et éviter les ressources payantes. L’inscription peut demander une carte, et une capacité gratuite peut être indisponible dans la région choisie. Ne pas confondre le crédit d’essai et les ressources Always Free.

Choisir Ubuntu 24.04 et au moins 2 Go de RAM, idéalement 4 Go pour construire les images. Les images utilisées existent pour x86-64 et ARM64 ; la vérification du dépôt a lieu sur x86-64. Associer une IP publique à la VM. Autoriser 80 et 443 TCP dans le réseau cloud et le pare-feu de la VM ; limiter SSH (22) à son adresse IP lorsque possible. Ne pas ouvrir 3354, 5173, 5432, 5499, 6379 ou 6380 au public.

## 2. Préparer Docker et le nom public

Installer Docker Engine et le plugin Compose selon les [instructions officielles Ubuntu](https://docs.docker.com/engine/install/ubuntu/). Vérifier `docker version` et `docker compose version`. Le compte qui lance les scripts doit pouvoir utiliser Docker ; l’accès au groupe docker donne des droits élevés sur la VM.

Faire pointer un domaine ou sous-domaine vers l’IP publique. Un sous-domaine d’un service DNS gratuit peut convenir si l’utilisateur le contrôle. Vérifier sa résolution avant de lancer Caddy, qui obtiendra et renouvellera un certificat HTTPS public automatiquement. Une IP locale ou un domaine `.example` ne permet pas de valider l’HTTPS public.

## 3. Configurer et lancer

Sur la VM :

```bash
git clone https://github.com/AlexTng44000/MangaTrack.git
cd MangaTrack
bash deploy/configure-vm.sh mon-site.mon-domaine.fr
bash deploy/start-vm.sh
```

Remplacer `mon-site.mon-domaine.fr` par le domaine réel. Le premier script crée `.env.production`, ignoré par Git et lisible seulement par son propriétaire, avec deux secrets aléatoires distincts. Il refuse d’écraser un fichier existant. Le script de démarrage construit les images, attend PostgreSQL/Redis, applique le schéma dans une transaction et lance l’API et le site. Il ne publie pas les ports internes. Les volumes de production sont distincts des volumes de développement.

Vérifier ensuite depuis une autre machine :

```bash
curl -fsS https://mon-site.mon-domaine.fr/api/health
```

Ouvrir le site en HTTPS, créer un compte de test, vérifier connexion, catalogue AniList, ajout à la bibliothèque et progression. Un démarrage local réussi ne prouve pas que les règles réseau/DNS/HTTPS du fournisseur sont correctes.

## 4. E-mails et rappels

Sans SMTP, inscription, catalogue, bibliothèque et progression fonctionnent ; les rappels peuvent être enregistrés et annulés mais **aucun e-mail n’est envoyé**. Le worker de livraison n’est pas lancé par défaut.

Pour activer l’envoi, renseigner `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` et `MAIL_FROM_EMAIL` dans `.env.production` via un éditeur sécurisé, puis lancer :

```bash
docker compose --env-file .env.production -f compose.production.yml --profile notifications up -d worker
```

Le worker refuse de démarrer sans identifiants et adresse d’expédition configurés. Vérifier que le fournisseur autorise SMTP sortant, et confirmer l’envoi d’un rappel réel après configuration. Ne pas compter sur un simple journal de démarrage comme preuve de livraison.

## 5. Mise à jour et sauvegarde

```bash
git pull origin main
bash deploy/start-vm.sh
# Si les e-mails ont été activés :
docker compose --env-file .env.production -f compose.production.yml --profile notifications up -d worker
```

Les migrations conservent les données. Ne pas exécuter `down -v` : cela détruirait les volumes. Sauvegarder régulièrement PostgreSQL et conserver une copie protégée de `.env.production`. Pour observer l’état, utiliser `docker compose --env-file .env.production -f compose.production.yml ps` et les logs des services, sans partager les secrets.

## Ce qui doit encore être fait hors du dépôt

Créer le compte cloud et la VM, installer Docker, configurer le domaine/DNS, puis exécuter les scripts sur cette VM avec un accès autorisé. La configuration du dépôt et ses tests locaux ne créent ni compte fournisseur, ni VM, ni URL publique. Il n’existe actuellement aucune identité cloud configurée dans cette session permettant de réaliser ces opérations à distance.
