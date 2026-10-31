# Faire tester MyMangaTracker à des amis

## Un premier essai gratuit depuis ton PC

[Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) permet d’exposer une application locale via HTTPS sans ouvrir de port sur ta box. C’est une piste adaptée à une démonstration ponctuelle : le PC, Docker et le tunnel doivent rester allumés. Le service n’héberge pas la base à ta place.

Il faut exposer le frontend **et** rendre son API accessible : les navigateurs de tes amis ne peuvent pas utiliser `http://localhost:3354`, qui désigne leur propre PC. Utiliser une origine commune avec un proxy `/api`, ou une URL HTTPS publique d’API et configurer `VITE_API_URL` ainsi que `CORS_ORIGIN`. Vite peut aussi nécessiter l’autorisation explicite du domaine du tunnel ; ne pas autoriser arbitrairement tous les domaines.

Pour un test public, conserver l’authentification, choisir une vraie clé JWT aléatoire et garder les ports PostgreSQL/Redis privés. Ne jamais intégrer les secrets dans le frontend ou dans Git.

## Un hébergement indépendant de ton PC

Pistes à comparer sur les pages officielles, car les quotas et conditions des offres gratuites évoluent :

| Élément | Pistes | Points à vérifier |
| --- | --- | --- |
| Frontend React/Vite | [Cloudflare Pages](https://pages.cloudflare.com/), [Vercel](https://vercel.com/pricing) | Build `npm ci && npm run build` dans `frontend`, sortie `dist`, réécriture SPA vers `index.html`, URL publique d’API au build. |
| API Express | [Render](https://render.com/docs/free) | Offre gratuite, veille/redémarrage éventuels, port fourni par `PORT`, routage HTTPS, accès réseau à AniList. |
| PostgreSQL | [Neon](https://neon.com/pricing) | Quotas gratuits, veille, connexion TLS et initialisation du schéma. La chaîne de connexion reste une variable backend. |
| Redis | [Upstash](https://upstash.com/pricing/redis) | Connexion Redis TCP/TLS compatible ioredis/BullMQ, commandes prises en charge, connexions et quota de commandes. BullMQ et son polling peuvent consommer le quota. Ne pas utiliser l’URL REST avec ioredis. |
| Toute la stack Docker | [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/) | VM Always Free, disponibilité des machines, validation du compte/carte et conditions de récupération des instances. Option plus technique, sans garantie de capacité. |

Le frontend seul ne suffit pas. L’application requiert PostgreSQL, Redis, l’API et un **worker de notifications**. Une API gratuite qui s’endort ne garantit pas des rappels à l’heure ; les offres gratuites de sites web ne fournissent pas nécessairement un worker permanent. Une offre d’essai ou un crédit limité n’équivaut pas à un hébergement gratuit durable.

Pour un essai entre quelques amis : commencer par le tunnel, ou accepter les limites d’une API gratuite avec un frontend statique et des bases externes. Pour garantir les rappels en continu, privilégier une VM où API et worker restent actifs, ou un petit hébergement payant quand le besoin est confirmé.

Avant un déploiement réel : choisir l’hébergeur, définir les URL/CORS, configurer la confiance du proxy Express selon le fournisseur, appliquer `init.sql` et les migrations, configurer JWT et l’envoi d’e-mails, puis tester inscription, connexion, catalogue et traitement d’un rappel. L’envoi SMTP ne doit pas utiliser les valeurs de démonstration de `.env.example`.

## Liens de visionnage et progression

Les liens ouvrent des sites externes. Une ouverture n’est pas une preuve de visionnage et le navigateur ne permet pas à MyMangaTracker de lire l’historique d’un autre site. Une synchronisation automatique demanderait une API officielle autorisée par la plateforme ou un lecteur intégré fournissant des événements de lecture exploitables.

L’interface propose donc une confirmation explicite « Vu jusqu’à l’épisode… ». Elle met à jour la progression enregistrée et les autres vues de la fiche, sans lire le compte de la plateforme externe. Les numéros ne sont reconnus que lorsqu’ils sont explicitement indiqués dans les titres d’épisodes ; les épisodes sans numéro fiable restent de simples liens. La position d’un élément dans la liste n’est pas utilisée comme numéro d’épisode.

Les relations anime/manga fournies par AniList sont affichées en priorité, avec l’épisode suivi et le point de reprise manuel lorsqu’il existe. AniList ne fournit pas une table générale d’équivalence épisode/chapitre : aucune correspondance précise n’est inventée.
