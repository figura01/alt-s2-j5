# 1. dentifier pourquoi Nextcloud affiche "Internal Server Error"
Nextcloud affiche “Internal Server Error” ici parce qu’il démarre avant que PostgreSQL soit réellement prêt.

Dans le legacy du docker-compose.yml:
```YAML
depends_on:
  - postgres
```
ça veut dire : “démarre le conteneur postgres avant nextcloud”, mais pas “attends que PostgreSQL soit prêt”.

# 2. Intégrer Redis comme cache pour Nextcloud
il faut ajouter REDIS_HOST: redis au service nextcloud

# 3. Mettre en place les health checks appropriés
- sur le service nextcloud:
```YAML
    healthcheck:
      test: ["CMD-SHELL", "php -r 'exit(file_get_contents(\"http://localhost/status.php\") ? 0 : 1);'"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
```
Le healthcheck sur nextcloud sert à vérifier que l’application web fonctionne réellement, pas seulement que le conteneur est démarré.

Sans healthcheck :

Docker considère le conteneur “OK” dès que le processus Apache/PHP tourne.
Mais Nextcloud peut encore être inutilisable :
- erreur base de données
- erreur Redis
- installation incomplète
- PHP en erreur
- page “Internal Server Error”

le test vérifie que :

- Apache répond
- PHP fonctionne
- Nextcloud répond sur /status.php
/status.php est un endpoint officiel Nextcloud utilisé pour le monitoring.

Donc ce healthcheck valide :
- HTTP OK
- PHP OK
- Nextcloud OK
et pas juste “le conteneur existe”.

# Corrections principales :

-suppression des ports publics PostgreSQL 5432 et Redis 6379
- ajout d’un réseau privé
- ajout d’un healthcheck PostgreSQL
- ajout de Redis dans Nextcloud avec REDIS_HOST
- mots de passe sortis du docker-compose.yml
- ajout de restart: unless-stopped