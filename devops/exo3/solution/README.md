# 1. Pourquoi la connexion PostgreSQL échoue

Le problème principal vient de cette ligne :
MM_SQLSETTINGS_DATASOURCE=postgres://mattermost:password@postgres:5432/mattermost
Le format est incorrect pour Mattermost.

Mattermost attend une chaîne PostgreSQL avec :
- sslmode=disable
et souvent le format DSN PostgreSQL complet

# 2. Chaîne de connexion correcte

Remplacer :
MM_SQLSETTINGS_DATASOURCE=postgres://mattermost:password@postgres:5432/mattermost

par :
MM_SQLSETTINGS_DATASOURCE=postgres://mattermost:${POSTGRES_PASSWORD}@postgres:5432/mattermost?sslmode=disable

- Le ?sslmode=disable est souvent indispensable en Docker local.

# 3. Configuration sécurisée avec .env
.env
POSTGRES_USER=mattermost
POSTGRES_PASSWORD=StrongMattermostPassword123!
POSTGRES_DB=mattermost

# 4. docker-compose.yml corrigé
version: '3.8'

services:

  mattermost:
    image: mattermost/mattermost-team-edition:latest
    platform: linux/amd64 // Pour mac M1/M2/M3 ARM
    container_name: mattermost_app

    ports:
      - "8065:8065"

    env_file:
      - .env

    environment:
      MM_SQLSETTINGS_DRIVERNAME: postgres
      MM_SQLSETTINGS_DATASOURCE: postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?sslmode=disable
      MM_SERVICESETTINGS_SITEURL: http://localhost:8065

    volumes:
      - mattermost_data:/mattermost/data
      - mattermost_logs:/mattermost/logs
      - mattermost_plugins:/mattermost/plugins

    depends_on:
      postgres:
        condition: service_healthy

    networks:
      - mattermost_network

    restart: unless-stopped

  postgres:
    image: postgres:15
    container_name: mattermost_postgres

    env_file:
      - .env

    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}

    volumes:
      - postgres_data:/var/lib/postgresql/data

    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s

    networks:
      - mattermost_network

    restart: unless-stopped

volumes:
  mattermost_data:
  mattermost_logs:
  mattermost_plugins:
  postgres_data:

networks:
  mattermost_network:
    driver: bridge

# 5. Commandes de test

Nettoyage :
```bash
docker compose down -v --remove-orphans
```

Démarrage :
```bash
docker compose up -d
```
Vérification :

```bash
docker compose ps
docker compose logs mattermost
docker compose logs postgres
```
# 6. Test final

Ouvrir :
http://localhost:8065

On dois voir :
- écran de création du premier compte administrateur
- plus aucune erreur Database connection failed