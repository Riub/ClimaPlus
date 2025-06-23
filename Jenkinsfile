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
                    echo 'Deteniendo y eliminando servicios Docker anteriores (manteniendo volúmenes)...'
                    sh 'docker-compose down || true'

                    echo 'Construyendo imágenes Docker...'
                    sh 'docker-compose build'

                    echo 'Levantando servicios Docker...'
                    sh 'docker-compose up -d'

                    echo 'Esperando a que la base de datos esté lista para conexiones...'
                    // --- ¡CORRECCIÓN AQUÍ! ---
                    // Añadir -T a docker-compose exec
                    sh '''
                        docker-compose exec -T db sh -c "
                            until pg_isready -h localhost -p 5432 -U climaplus -d climaplus; do
                                echo 'Esperando por db...'
                                sleep 2
                            done
                        "
                    '''

                    echo 'Ejecutando script de inicialización de la base de datos (db/init.js)...'
                    // También deberías añadir -T aquí por si acaso, aunque a veces Node no lo necesita tanto.
                    sh 'docker-compose exec -T backend node db/init.js'

                    echo 'Confirmando que las tablas se crearon en la BD...'
                    // También añadir -T aquí, ya que psql en modo -c no es interactivo.
                    sh 'docker-compose exec -T db psql -U climaplus -d climaplus -c "\\dt"'

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