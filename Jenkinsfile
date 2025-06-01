pipeline {
    agent any
    stages {
        stage('Despliegue') {
            steps {
                sh 'docker-compose down || true'  
                sh 'docker-compose build --no-cache'
                sh 'docker-compose up -d'
            }
        }
    }
}