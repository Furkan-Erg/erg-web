pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
    }

    stages {
        stage('Build site') {
            steps {
                // Bağımlılık yok; eksik metin anahtarı varsa build.mjs hata verir.
                sh 'node build.mjs'
                sh 'node --check stats/server.mjs'
            }
        }

        stage('Docker build') {
            steps {
                sh 'docker build -t erg-web:${BUILD_NUMBER} .'
                sh 'docker build -t erg-web-stats:${BUILD_NUMBER} stats'
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    git config --global --add safe.directory /home/furkan/erg-web
                    cd /home/furkan/erg-web
                    git pull
                    docker compose up -d --build
                '''
            }
        }

        stage('Health check') {
            steps {
                // Port yalnız host'un 127.0.0.1'ine bağlı; kontrol container'ın içinden yapılır.
                retry(5) {
                    sh '''
                        sleep 2
                        cd /home/furkan/erg-web
                        docker compose exec -T erg-web wget -q -O /dev/null http://127.0.0.1/
                        docker compose exec -T erg-web wget -q -O /dev/null http://127.0.0.1/tr/
                        docker compose exec -T erg-web wget -q -O /dev/null http://127.0.0.1/api/health
                    '''
                }
            }
        }
    }

    post {
        always {
            sh 'docker rmi erg-web:${BUILD_NUMBER} erg-web-stats:${BUILD_NUMBER} || true'
            cleanWs()
        }
    }
}
