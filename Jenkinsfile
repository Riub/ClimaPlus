pipeline {
    agent any
    stages {
        stage('Clonar y Crear') {
            steps {
                sh 'docker compose down || true' 
                sh 'docker compose build --no-cache'
            }
        }
        stage('Desplegar') {
            steps {
                sh 'docker compose up -d'
            }
        }
    }
}