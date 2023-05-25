# Glosario kubernetes
A continuaciòn se muestra el glosario de los comandos más comunes de kubernetes con un breve descripción de estos.

![Estado de PODs](https://github.com/innovadeveloper/uml_diagrams/blob/master/kubernetes_training/get-pods-status.png?raw=true)

## Características
- (1) Estructura del proyecto de entrenamiento
- (1) Definición de un fichero Dockerfile
- (2) Creación de un repositorio público en Dockerhub para la construcción y subida de la imagen
- (3) Preparando el entorno de kubernetes (namespaces, pvc, pv)
- (4) Definición de un fichero deployment de kubernetes
- (5) Aplicación del deployment de kubernetes
- (6) Gestión de pods y deployments (revisar estado, logs, eliminar)
- ()

## (1) Estructura del proyecto de entrenamiento
Se muestra a continuación el file system del proyecto en nodejs utilizado para el entrenamiento de kubernetes.

```shell
.
├── API-Kubernetes.postman_collection.json
├── assets
│   └── data.json
├── devops
│   ├── Dockerfile
│   ├── deployment.yaml
│   └── pod.yaml
├── package-lock.json
├── package.json
├── readme.md
└── server.js
```

## (2) Definición de un fichero Dockerfile y su construcción de imagen
Se muestra a continuación el contenido del fichero Dockerfile del proyecto :

```Dockerfile
# Utilizar la imagen base de Node.js
FROM node:14

# Establecer el directorio de trabajo en la imagen
WORKDIR /app

# Copiar el package.json y package-lock.json al directorio de trabajo
COPY package*.json ./

# Instalar las dependencias
RUN npm install

# Copiar el código fuente de la aplicación al directorio de trabajo
COPY . .

# Exponer el puerto 3000 para acceder a la aplicación
EXPOSE 3000

# Comando para ejecutar la aplicación
CMD [ "npm", "run", "start" ]
```

## (3) Creación de un repositorio público en Dockerhub para la construcción y subida de la imagen

#### (3.1) Creación de un repositorio público
Ingresar al registry de dockerhub : https://hub.docker.com/ , crearse una cuenta y luego proceder a crear un repositorio. Para este ejemplo se creó el repositorio "mock-server-api" de forma pública, sin embargo también se puede utilizar otros registrys privados como el de gitlab.

![Repositorio de dockerhub](https://github.com/innovadeveloper/uml_diagrams/blob/master/kubernetes_training/registry-dockerhub.png?raw=true)
#### (3.2) Construcción de la imagen
Para la construcción de la imagen corremos la siguiente línea de comando : 

**Sintaxis**
```shell
docker build -t [image-name]:[tag] -f [docker-file] .
```
**Ejemplo**
```shell
docker build -t innovadeveloper/mock-server-api:latest -f devops/Dockerfile .
```
#### (3.3) Subida de la imagen al registry
Para la subida de la imagen corremos la siguiente línea de comando : 
```shell
docker push innovadeveloper/mock-server-api:latest
```

## (4) Preparando el entorno de kubernetes (namespaces, pvc, pv)
#### (4.1) Configurando entorno con minikube en un shell de unix o linux
Encender el cluster. Para este entrenamiento estamos utilizando minikube y si deseamos encender el cluster corremos la siguiente línea : 
```shell
# Encender el cluster
minikube start

# Pausar el cluster
minikube pause

# Detener el cluster
minikube stop
```
Luego de encender el cluster ya podremos ejecutar comandos dentro del cluster de la siguiente forma :

*(1 era forma)*
```shell
#  Listar PODs usando el comando minikube 
minikube kubectl -- get pods
```

*(2 da forma)* más abreviada
```shell
# Crear una variable de ejecución durante la sesión con la terminal
export kubectl="minikube kubectl --"

# Ejecutar el comando kubectl
kubectl get pods
```

#### (4.1) Configurando los namespaces a utilizarse (no mandatorio)
El namespace de Kubernetes se utiliza para crear un ámbito aislado y lógico dentro de un clúster, lo que permite organizar y gestionar recursos de forma separada. Para la creación del namespace corremos la siguiente línea de comando : 


**Sintaxis**
```shell
kubectl create namespace [my-namespace]
```
**Ejemplo (creación y listar los namespaces)**
```shell
# create namespace
kubectl create namespace mock-server-namespace

# listar los namespace
kubectl get namespaces
```
#### (4.2) Configurando el PersistentVolume (PV) (no mandatorio)
A continuación se muestra el fichero pv.yaml
```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: mock-server-api-pv  # (important) este nombre del PV deberá de coincidir con el PVC más adelante
spec:
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: standard
  hostPath:
    # path: ./../assets/ # no recomendado utilizar paths relativos por la incompatibilidad con distintos tipos de cluster, además de q kubernetes no permite ".."
    path: /Users/kennybaltazaralanoca/Projects/NodeProjects/mock-server-project/assets/
```
Aplicación del fichero pv.yaml
```shell
kubectl apply -f devops/pv.yaml
```
Revisión de los PV creados
```shell
kubectl get pv

NAME                 CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                         STORAGECLASS   REASON   AGE
mock-server-api-pv   1Gi        RWO            Retain           Bound    default/mock-server-api-pvc   standard                18m
```
#### (4.3) Configurando el PersistentVolumeClaim (PVC) (no mandatorio)
A continuación se muestra el fichero pvc.yaml
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mock-server-api-pvc # (important) el nombre debe coincidir con el del PV.
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
```
Aplicación del fichero pvc.yaml
```shell
kubectl apply -f devops/pvc.yaml
```
Revisión de los PVC creados
```shell
kubectl get pvc

NAME                  STATUS   VOLUME               CAPACITY   ACCESS MODES   STORAGECLASS   AGE
mock-server-api-pvc   Bound    mock-server-api-pv   1Gi        RWO            standard       18m
```
**Nota** Es importante tener en cuenta que la asociación entre el PVC y el PV se basa en el nombre. **El PVC y el PV deben tener nombres coincidentes** para establecer la conexión entre ellos.

## (5) Definición de un fichero deployment de kubernetes
#### (5.1) Definición del fichero deployment
A continuación se muestra el fichero deployment.yaml

Sintaxis :

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      volumes:
        - name: my-volume
          persistentVolumeClaim:
            claimName: my-pvc
      containers:
        - name: my-container
          image: my-image
          ports:
            - containerPort: my-port
          volumeMounts:
            - name: my-volume
              mountPath: /data/
```

Ejemplo :
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mock-server-api-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mock-server-api
  template:
    metadata:
      labels:
        app: mock-server-api
    spec:
      volumes:
        - name: mock-server-api-volume
          persistentVolumeClaim:
            claimName: mock-server-api-pvc
      containers:
        - name: mock-server-api-container
          image: innovadeveloper/mock-server-api:latest
          ports:
            - containerPort: 3000
          volumeMounts:
            - name: mock-server-api-volume
              mountPath: /data/
```



## License

MIT



