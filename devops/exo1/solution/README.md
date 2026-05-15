# 1. Erreur principale

MySQL ne démarre pas car il manque :
MYSQL_ROOT_PASSWORD

Cette variable est obligatoire pour l’image officielle MySQL, sauf si on utilise MYSQL_ALLOW_EMPTY_PASSWORD ou MYSQL_RANDOM_ROOT_PASSWORD.

Autre problème : depends_on attend seulement que le conteneur MySQL soit lancé, pas que MySQL soit prêt à accepter les connexions. Il faut ajouter un healthcheck.

# 2 Problème connexion Wordpress <-> MySQL
Pour corriger la connexion WordPress ↔ MySQL, il faut surtout aligner les variables et attendre que MySQL soit prêt.

Problèmes: 
- WORDPRESS_DB_HOST doit pointer vers le nom du service MySQL :
- WORDPRESS_DB_HOST: mysql:3306

Les identifiants WordPress doivent être identiques à ceux créés côté MySQL :
- MYSQL_USER: wordpress
- MYSQL_PASSWORD: wordpress
- MYSQL_DATABASE: wordpress

et côté WordPress :
- WORDPRESS_DB_USER: wordpress
- WORDPRESS_DB_PASSWORD: wordpress
- WORDPRESS_DB_NAME: wordpress
- depends_on seul ne suffit pas : MySQL peut être lancé mais pas encore prêt. Il faut ajouter un healthcheck.

# 3 Sécuriser la configuration (mots de passe, réseau)
L’objectif est d’éviter :

les mots de passe en clair dans le docker-compose.yml
l’exposition inutile de MySQL
les communications non isolées entre services

## 1. Utiliser un fichier .env
MYSQL_ROOT_PASSWORD=StrongRootPass123!
MYSQL_DATABASE=wordpress
MYSQL_USER=wp_user
MYSQL_PASSWORD=StrongWordpressPass456!

## 2. Retirer les mots de passe du docker-compose.yml
Mauvaise pratique
```YAML
environment:
  MYSQL_PASSWORD: wordpress
```
Bonne pratique
```YAML
environment:
  MYSQL_PASSWORD: ${MYSQL_PASSWORD}
```

## 3. Créer un réseau privé Docker

Cela permet aux conteneurs de communiquer entre eux sans exposer MySQL à l’extérieur.
```YAML
networks:
  wordpress_network:
    driver: bridge
```
Puis :
```YAML
services:
  wordpress:
    networks:
      - wordpress_network

  mysql:
    networks:
      - wordpress_network

  phpmyadmin:
    networks:
      - wordpress_network
```

## 4. Ne pas exposer MySQL publiquement
Mauvaise pratique
```YAML
ports:
  - "3306:3306"
```
Cela expose MySQL sur la machine hôte.

Bonne pratique
Supprimer complètement :
- pas de ports pour mysql

Les autres conteneurs peuvent toujours joindre MySQL via :
mysql:3306
grâce au réseau Docker interne.

## 5. Ajouter un healthcheck

Cela évite que WordPress tente une connexion avant que MySQL soit prêt.

```YAML
healthcheck:
      test:
        [
          "CMD-SHELL",
          "mysqladmin ping -h 127.0.0.1 -uroot -p$${MYSQL_ROOT_PASSWORD} || exit 1",
        ]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 40s
```
Et ajouter la dependence au service wordpress
```YAML
  depends_on:
    mysql:
      condition: service_healthy
```

## 6. Ajouter une politique de redémarrage
```YAML
restart: unless-stopped
```

Permet :
- redémarrage automatique
- meilleure résilience


# 4. Commandes de test
```bash
docker compose down -v
docker compose up -d
docker compose logs mysql
docker compose logs wordpress
docker compose ps
```

# Tester MySQL :

```bash
docker compose exec mysql mysql -uwordpress_user -pwordpress_password_secure wordpress
```

# Accès navigateur :
WordPress   : http://localhost:8080
PhpMyAdmin  : http://localhost:8081

# Bonnes pratiques appliquées
- Ajout de MYSQL_ROOT_PASSWORD.
- Mots de passe sortis du docker-compose.yml via .env.
- Suppression de l’exposition du port MySQL vers l’hôte.
- Ajout d’un réseau Docker dédié.
- Ajout d’un healthcheck MySQL.
- Utilisation de depends_on.condition: service_healthy.
- Ajout de restart: unless-stopped.