pipeline {
    agent any
    stages {
        stage('Despliegue') {
            steps {
                sh 'docker-compose down || true'  
                sh 'docker-compose build'
                sh 'docker-compose up -d'
            }
        }
    }
}