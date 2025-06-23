pipeline {
    agent any

    stages {
        stage('Build & Test Frontend/Backend') {
            steps {
                dir('backend') {
                    echo 'Instalando dependencias de backend...'
                    sh 'npm install'
                    echo 'Ejecutando pruebas de backend...'
                    sh 'npm test'
                }
                dir('climaplus-frontend') {
                    echo 'Instalando dependencias de frontend...'
                    sh 'npm install'
                    echo 'Ejecutando pruebas de frontend...'
                    sh 'npm test'
                }
            }
        }

        stage('Deploy Docker Services') {
            steps {
                script {
                    echo 'Deteniendo y eliminando servicios Docker anteriores (incluyendo volúmenes si es un inicio limpio de DB)...'
                    // Usar 'docker compose down -v' si se requiere  que la base de datos se borre y se reinicie en cada build.
                    sh 'docker-compose down || true' 

                    echo 'Construyendo imágenes Docker...'
                    sh 'docker-compose build'

                    echo 'Levantando servicios Docker...'
                    sh 'docker-compose up -d'

                    echo 'Esperando a que la base de datos esté lista para conexiones...'

                    sh 'docker-compose exec db sh -c "until pg_isready -h localhost -p 5432 -U climaplus -d climaplus; do echo \\"Esperando por db...\"; sleep 2; done"'

                    echo 'Ejecutando script de inicialización de la base de datos (db/init.js)...'
                    // Asegúrate de que tu backend tenga el código en /app/db/init.js
                    sh 'docker-compose exec backend node db/init.js'

                    echo 'Confirmando que las tablas se crearon en la BD...'
                    // Usamos 'climaplus' como usuario y DB, según tu docker-compose.yml
                    sh 'docker-compose exec db psql -U climaplus -d climaplus -c "\\dt"'

                    echo 'Servicios Docker desplegados y DB inicializada.'
                }
            }
        }
    }

    post {
        failure {
            emailext (
                subject: "🚨 Pipeline FALLIDO: ${env.JOB_NAME} - Build #${env.BUILD_NUMBER}",
                body: "El pipeline '${env.JOB_NAME}' ha fallado en el build #${env.BUILD_NUMBER}.\n" +
                      "Revisa los detalles aquí: ${env.BUILD_URL}console",
                to: "dracon_019@hotmail.es"
            )
        }
        success {
            emailext (
                subject: "✅ Pipeline EXITOSO: ${env.JOB_NAME}",
                body: "El pipeline '${env.JOB_NAME}' ha finalizado con éxito en el build #${env.BUILD_NUMBER}.\n" +
                      "Detalles: ${env.BUILD_URL}console",
                to: "dracon_019@hotmail.es"
            )
        }
        always {
            echo 'Realizando limpieza final...'
            sh 'docker-compose down' 
        }
    }
}