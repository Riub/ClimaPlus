pipeline {
    agent any
    stages {
        stage('Build & Deploy') {
            steps {
                sh 'docker-compose down || true'  
                sh 'docker-compose build --no-cache'
                sh 'docker-compose up -d'
            }
        }
    }
}