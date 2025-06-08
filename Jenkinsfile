pipeline {
    agent any

    options {

        timeout(time: 30, unit: 'MINUTES')
    }

    stages {
        stage('Preparar Entorno y Dependencias') {
            steps {

                dir('backend') {
                    sh 'npm install'
                }

                dir('climaplus-frontend') {
                    sh 'npm install'
                }
            }
        }

        stage('Ejecutar Pruebas de Backend') {
            steps {
                dir('backend') {

                    sh 'npm test'
                }
            }
        }

        stage('Ejecutar Pruebas de Frontend') {
            steps {
                dir('climaplus-frontend') {

                    sh 'npm test -- --watchAll=false'
                }
            }
        }

        stage('Despliegue Docker') {
            steps {

                sh 'docker-compose down || true'


                sh 'docker-compose build'

                
                sh 'docker-compose up -d'
            }
        }
    }

    post {
        
        always {
            echo 'Pipeline de CI/CD completado.'

        }
        success {
            echo '¡Despliegue exitoso!'
           
        }
        failure {
            echo '¡El pipeline falló! Revisa los logs.'
           
        }
    }
}