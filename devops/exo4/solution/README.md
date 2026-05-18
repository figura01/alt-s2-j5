# 1. Pourquoi Elasticsearch crash

Les causes probables sont :
- mémoire Docker trop faible
- heap JVM mal dimensionné
- vm.max_map_count trop bas sur l’hôte Linux
- Kibana / Logstash démarrent avant qu’Elasticsearch soit réellement prêt.

Pour Elasticsearch en Docker, Elastic recommande de configurer vm.max_map_count sur l’hôte. Pour les versions 8.15 et antérieures, la valeur attendue est généralement 262144.

Sur Linux :
- sudo sysctl -w vm.max_map_count=262144

Pour le rendre permanent :
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf

# 2. docker-compose.yml corrigé

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: elk_elasticsearch
    environment:
      discovery.type: single-node
      xpack.security.enabled: "false"
      ES_JAVA_OPTS: "-Xms1g -Xmx1g"
      bootstrap.memory_lock: "true"
    ulimits:
      memlock:
        soft: -1
        hard: -1
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    networks:
      - elk_network
    healthcheck:
      test:
        [
          "CMD-SHELL",
          "curl -fs http://localhost:9200/_cluster/health || exit 1",
        ]
      interval: 20s
      timeout: 10s
      retries: 10
      start_period: 60s
    restart: unless-stopped

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    container_name: elk_logstash
    environment:
      LS_JAVA_OPTS: "-Xms512m -Xmx512m"
    ports:
      - "5044:5044"
      - "9600:9600"
    volumes:
      - ./logstash/config/logstash.yml:/usr/share/logstash/config/logstash.yml:ro
      - ./logstash/pipeline:/usr/share/logstash/pipeline:ro
    depends_on:
      elasticsearch:
        condition: service_healthy
    networks:
      - elk_network
    healthcheck:
      test: ["CMD-SHELL", "curl -fs http://localhost:9600 || exit 1"]
      interval: 20s
      timeout: 10s
      retries: 10
      start_period: 60s
    restart: unless-stopped

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: elk_kibana
    environment:
      ELASTICSEARCH_HOSTS: "http://elasticsearch:9200"
    ports:
      - "5601:5601"
    depends_on:
      elasticsearch:
        condition: service_healthy
    networks:
      - elk_network
    healthcheck:
      test: ["CMD-SHELL", "curl -fs http://localhost:5601/api/status || exit 1"]
      interval: 20s
      timeout: 10s
      retries: 15
      start_period: 90s
    restart: unless-stopped

  filebeat:
    image: docker.elastic.co/beats/filebeat:8.11.0
    container_name: elk_filebeat
    user: root
    command: ["--strict.perms=false"]
    volumes:
      - ./filebeat/filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    depends_on:
      logstash:
        condition: service_healthy
    networks:
      - elk_network
    restart: unless-stopped

volumes:
  elasticsearch_data:

networks:
  elk_network:
    driver: bridge

## logstash/config/logstash.yml
http.host: "0.0.0.0"
xpack.monitoring.enabled: false

## logstash/pipeline/logstash.conf
input {
  beats {
    port => 5044
  }
}

## Output
output {
  elasticsearch {
    hosts => ["http://elasticsearch:9200"]
    index => "filebeat-%{+YYYY.MM.dd}"
  }

  stdout {
    codec => rubydebug
  }
}

Logstash cherche par défaut les pipelines dans /usr/share/logstash/pipeline/, donc ton montage est cohérent.

# 5. filebeat/filebeat.yml
filebeat.inputs:
  - type: filestream
    id: system-logs
    enabled: true
    paths:
      - /var/log/*.log

output.logstash:
  hosts: ["logstash:5044"]

processors:
  - add_host_metadata:
      when.not.contains.tags: forwarded

Le --strict.perms=false évite les erreurs de permissions sur filebeat.yml monté depuis l’hôte. Elastic indique que les fichiers de configuration Beats sont soumis à des contrôles stricts de propriétaire et permissions.

# 6. Commandes de test
docker compose down -v --remove-orphans
docker compose up -d
docker compose ps

Tester Elasticsearch :
```bash
curl http://localhost:9200
curl http://localhost:9200/_cluster/health?pretty
```

Tester Logstash :
```bash
curl http://localhost:9600
```

Tester Kibana :
```bash
http://localhost:5601
```

# 7. Tester l’ingestion de logs

Créer une ligne de log :

echo "test elk $(date)" | sudo tee -a /var/log/test-elk.log

Vérifier dans Elasticsearch :

curl "http://localhost:9200/_cat/indices?v"

Puis dans Kibana :
Stack Management → Data Views → Create data view

Nom :
filebeat-*

Ensuite :
Discover → filebeat-*

# 1. Optimisations sécurité / performance

Pour un TP local, xpack.security.enabled=false simplifie les tests. En production, il faudrait activer la sécurité Elastic, utiliser HTTPS, des mots de passe, des certificats et éviter d’exposer inutilement les ports internes.

À améliorer :
- ne pas exposer 9300 ;
- garder uniquement 9200, 5601, 5044 si nécessaire ;
- augmenter la mémoire Docker Desktop à au moins 4 Go ;
- utiliser ES_JAVA_OPTS=-Xms1g -Xmx1g minimum ;
- mettre les fichiers de configuration en lecture seule avec :ro ;
- utiliser un réseau Docker dédié ;
- ajouter des healthchecks sur Elasticsearch, Logstash et Kibana.