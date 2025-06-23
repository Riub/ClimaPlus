pipeline {
    agent any

    stages {
        stage('Build & Test Frontend/Backend') {
            steps {
                script {
                    echo 'Deteniendo y eliminando todos los servicios Docker anteriores (y volúmenes si es necesario para un inicio limpio de DB para tests)...'
                    sh 'docker-compose down || true' 

                    echo 'Levantando solo la base de datos para tests...'
                    sh 'docker-compose up -d db'

                    echo 'Esperando a que la base de datos esté lista para tests...'
                    sh '''
                        docker-compose exec -T db sh -c "
                            until pg_isready -h localhost -p 5432 -U climaplus -d climaplus; do
                                echo 'Esperando por db para tests...'
                                sleep 2
                            done
                        "
                    '''

                    dir('backend') {
                        echo 'Instalando dependencias de backend...'
                        sh 'npm install'
                        echo 'Ejecutando pruebas de backend...'
                        sh 'chmod +x node_modules/.bin/jest && DATABASE_URL_TEST="postgres://climaplus:climaplus123@localhost:5432/climaplus" DATABASE_URL="postgres://climaplus:climaplus123@localhost:5432/climaplus" ./node_modules/.bin/jest --detectOpenHandles'
                    }
                    dir('climaplus-frontend') {
                        echo 'Instalando dependencias de frontend...'
                        sh 'npm install'
                        echo 'Ejecutando pruebas de frontend...'
                        sh 'npm test'
                    }
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

                    echo 'Esperando a que la base de datos esté lista para conexiones de la aplicación principal...'
                    sh '''
                        docker-compose exec -T db sh -c "
                            until pg_isready -h localhost -p 5432 -U climaplus -d climaplus; do
                                echo 'Esperando por db para aplicación principal...'
                                sleep 2
                            done
                        "
                    '''
                    echo 'Ejecutando script de inicialización de la base de datos (db/init.js)...'
                    sh 'docker-compose exec -T backend node db/init.js'

                    echo 'Confirmando que las tablas se crearon en la BD...'
                    sh 'docker-compose exec -T db psql -U climaplus -d climaplus -c "\\dt"'

                    echo 'Servicios Docker desplegados y DB inicializada.'
                }
            }
        }
    }
}