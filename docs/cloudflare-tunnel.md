# Test temporaire avec Cloudflare Tunnel depuis Windows

Le tunnel doit tourner sur le PC qui exécute MangaTrack et où AniList fonctionne. Il ne migre pas les données dans le cloud et ne crée pas de VM. Docker Desktop et le PC doivent rester allumés pendant le test. Le lien expose une application réelle : partager uniquement avec les testeurs souhaités, qui pourront créer leurs comptes. Ne pas ouvrir de ports sur la box.

## Lancer depuis PowerShell

Depuis la racine du dépôt :

```powershell
git pull origin main
node .\deploy\prepare-tunnel.mjs
docker compose -f docker-compose.yml -f compose.tunnel.yml up -d --build frontend tunnel
docker compose -f docker-compose.yml -f compose.tunnel.yml logs -f tunnel
```

Le helper conserve la configuration existante et remplace seulement une clé JWT de démonstration/manquante par une clé aléatoire. Il ne l’affiche pas. Si la clé a changé, reconnecter les sessions existantes après le redémarrage.

Attendre dans les logs une adresse du type `https://quelque-chose.trycloudflare.com`. C’est **cette URL** qu’il faut ouvrir et partager. Les URL localhost ne conviennent pas à tes amis. Un Quick Tunnel ne demande pas de compte Cloudflare et reste un service de test temporaire ; son adresse peut changer après recréation du tunnel.

Le conteneur officiel `cloudflare/cloudflared` est téléchargé par Docker : aucune installation Windows de cloudflared ou modification de la politique PowerShell n’est nécessaire. La commande utilise le protocole HTTP/2 plutôt que QUIC, ce qui évite de dépendre d’un accès UDP sortant. Si le réseau bloque les connexions du tunnel, consulter les logs plutôt que de désactiver les protections du réseau.

## Pourquoi une seule URL suffit

L’override configure `VITE_API_URL=/api` et le proxy Vite relaie `/api/*` vers le backend sur le réseau Docker. Le navigateur utilise ainsi la même origine pour le site et l’authentification. Aucune adresse `localhost:3354` n’est transmise aux visiteurs. Cloudflared transmet le nom d’hôte local attendu par Vite ; les contrôles d’hôtes Vite restent activés, sans `allowedHosts: true` ni joker public.

Seul le frontend est la cible du tunnel. Les services et volumes de développement existants sont conservés. Le lancement ciblé ne démarre pas un worker e-mail qui aurait été arrêté.

## Vérifier avec un ami

Ouvrir l’URL publique dans une fenêtre privée ou sur un autre appareil, créer un compte de test puis vérifier connexion, catalogue AniList et ajout à la bibliothèque. Les comptes et modifications sont enregistrés dans ta base locale existante. Si la page s’ouvre mais pas le catalogue, vérifier les logs backend et l’accès à AniList séparément ; un tunnel n’annule pas les limites du fournisseur.

Le démarrage du conteneur ne prouve pas que le tunnel est joignable : il faut attendre la confirmation de connexion et tester l’URL HTTPS depuis un autre appareil. Les offres Quick Tunnel ont des limites et ne remplacent pas l’hébergement permanent documenté dans `deploy-free-vm.md`.

## Arrêter le partage

`Ctrl+C` arrête seulement le suivi des logs. Pour fermer réellement l’accès public :

```powershell
docker compose -f docker-compose.yml -f compose.tunnel.yml stop tunnel
```

Pour retrouver ensuite la configuration de développement d’origine :

```powershell
docker compose -f docker-compose.yml up -d frontend
```

Ne pas utiliser `down -v` : les volumes contiennent ta bibliothèque et tes comptes.
