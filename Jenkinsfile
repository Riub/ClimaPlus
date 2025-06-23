pipeline {
    agent any
    stages {
        stage('Build & Test') {
            steps {
                dir('backend') {
                    sh 'npm install'
                    sh 'npm test'  // Ejecuta pruebas de backend (Mocha/Jest)
                }
                dir('climaplus-frontend') {
                    sh 'npm install'
                    sh 'npm test'  // Ejecuta pruebas de frontend (Jest)
                }
            }
        }
        stage('Deploy') {
            steps {
                sh 'docker-compose down || true'
                sh 'docker-compose build --no-cache'
                sh 'docker-compose up -d'
            }
        }
    }
    post {
        failure {
            emailext (
                subject: "🚨 Pipeline FALLIDO: ${env.JOB_NAME}",
                body: "Detalles: ${env.BUILD_URL}console",
                to: "tu-email@example.com"
            )
        }
    }
}