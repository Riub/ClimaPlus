pipeline {
    agent any
    stages {
        stage('Build & Deploy') {
            steps {
                sh 'docker-compose down || true'  // Detiene contenedores si existen
                sh 'docker-compose build --no-cache'
                sh 'docker-compose up -d'
            }
        }
    }
}