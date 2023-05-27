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
#### (4.0) Instalando microK8s ( osx )
Instalación de [microk8s](https://microk8s.io/docs/install-macos) en osx. Esto instalará una máquina virtual con el sistema operativo ubuntu.
```shell
# install microk8s con brew
brew install ubuntu/microk8s/microk8s

# run the installer
microk8s install

# check status
microk8s status --wait-ready

# crear la variable dentro de la sesión del shell
export kubectl="microk8s kubectl "
```
#### (4.1) Configurando entorno (complementos) microK8s ( osx )
![Repositorio de dockerhub](https://github.com/innovadeveloper/uml_diagrams/blob/master/kubernetes_training/microk8s_status.png?raw=true)

De forma predeterminada, vas a obtener **una versión de Kubernetes básica**. **Los servicios adicionales**, como el panel, el core-dns o el almacenamiento local, se deben habilitar ejecutando el comando microk8s enable:

```shell
microk8s enable dns dashboard storage
```
### (4.2) Descubrir los nodos del cluster y la ip asociado a estos.
El siguiente comando listará los nodos del cluster y en la columna **NAME** tendremos el hostname de la máquina virtual y la columna **INTERNAL-IP** es la ip a la q podremos apuntar desde fuera del cluster.
```shell
kubectl get nodes -o wide

NAME          STATUS   ROLES    AGE    VERSION   INTERNAL-IP    EXTERNAL-IP   OS-IMAGE             KERNEL-VERSION       CONTAINER-RUNTIME
microk8s-vm   Ready    <none>   175m   v1.26.4   192.168.64.2   <none>        Ubuntu 18.04.6 LTS   4.15.0-211-generic   containerd://1.6.15
```
### (4.3) Configurar el Dashboard de microk8s 
Recuperamos el token de login del dashboard. [(Más info)](https://microk8s.io/docs/addon-dashboard)
```shell
multipass exec <MICROK8S_HOSTNAME> -- sudo /snap/bin/microk8s kubectl -n kube-system describe secret $(multipass exec <MICROK8S_HOSTNAME> -- sudo /snap/bin/microk8s kubectl -n kube-system get secret | grep default-token | cut -d " " -f1)
```

Enseguida se ejecute ese comando, retornará en la shell un token : 
```shell
Data
====
ca.crt:     1123 bytes
namespace:  11 bytes
token:      eyJhbGciOiJSU..................................1OvsQr7eGA
```

Iniciar el dashboard con el siguiente comando : 
```shell
multipass exec <MICROK8S_HOSTNAME> -- sudo /snap/bin/microk8s kubectl port-forward -n kube-system service/kubernetes-dashboard 10443:443 --address 0.0.0.0
```
Podremos acceder al dashboard con la siguiente url :
https://<MICROK8S_IP>:10443

![Dashboard](https://github.com/innovadeveloper/uml_diagrams/blob/master/kubernetes_training/microk8s_dashboard.png?raw=true)

### (4.4) Configurar el Dashboard de microk8s 
Kubernetes soporta RBAC (Control basado en roles de acceso), esto significa que se podrá definir roles y permisos granulares para diferentes entidades, como usuarios, grupos y servicios.

**Creación de un usario de tipo admin**
Para este ejemplo de creación de un usario de tipo admin utilizaremos el rol predefinido (cluster-admin) de kubernetes.
- Definición del service account y cluster role binding
```yaml
# example filename: my-user-admin-service-account.yaml

apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-user-admin # <user-admin-name>
  # namespace: kubernetes-dashboard
```

```yaml
# example filename: my-user-admin.yaml

apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: my-user-admin # <user-admin-name>
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin # another cluster roles : view, edit, cluster-admin
subjects:
- kind: User
  name: my-user-admin # <user-admin-name>

```
- Aplicación de las definiciones service account y cluster role binding.

```shell
# aplicación de service account
kubectl apply -f my-user-admin-service-account.yaml  

# aplicación del cluster role binding
kubectl apply -f my-user-admin.yaml  
```
- Extracción del token de un usuario
```shell
# seleccionar el nombre de la cuenta de servicio
kubectl create token <my-user-admin>

eyJhbGciOiJSUz......................................zhHNC10eX
```
- Gestión de los service account y cluster role binding
```shell
# Listar las cuentas de servicio
kubectl get ServiceAccount

# Listar las cuenta cluster role binding
kubectl get ClusterRoleBinding

# Remover un acceso : service-account y cluster role binding
kubectl delete clusterrolebinding <my-user-admin>
kubectl delete serviceaccount <my-user-admin>

```
 
Ingresar el token en la web del dashboard 

![Ingresar token](https://github.com/innovadeveloper/uml_diagrams/blob/master/kubernetes_training/kubectl-dashboard-ingress-token.png?raw=true)

Revisando la info del usuario
 
![Info del usuario](https://github.com/innovadeveloper/uml_diagrams/blob/master/kubernetes_training/kubectl-dashboard-user-info.png?raw=true)

 
 
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
      app: my-app   # Este selector garantizará al Deployment tener el control de los PODs q tengan el mismo nombre de etiqueta.
  template:
    metadata:
      labels:
        app: my-app     # identificador de los PODs 
    spec:
      volumes:
        - name: my-volume   # nombre de volumen q se asociará al PVC y se compartirá a los contenedores q lo invoquen
          persistentVolumeClaim:
            claimName: my-pvc   # PVC previamente ya creado
      containers:
        - name: my-container
          image: my-image   # imagen alojada en el registry o en alguno de los POD's q se encuentre en ejecución.
          ports:
            - containerPort: my-port
          volumeMounts:
            - name: my-volume   # nombre de volumen q se definió en el objeto "spec"
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
#### (5.2) Aplicación del fichero deployment
A continuación se muestra la aplicación del fichero deployment.yaml
```shell
kubectl apply -f ./devops/deployment.yaml
```
Revisión de los deployment creados
```shell
kubectl get deployment

NAME                         READY   UP-TO-DATE   AVAILABLE   AGE   CONTAINERS                  IMAGES                                   SELECTOR
mock-server-api-deployment   3/3     3            3           45m   mock-server-api-container   innovadeveloper/mock-server-api:latest   app=mock-server-api
```

Revisión de los pods creados 
```shell
kubectl get pods

NAME                                          READY   STATUS    RESTARTS   AGE   IP            NODE       NOMINATED NODE   READINESS GATES
mock-server-api-deployment-68bf6df6df-7j2t6   1/1     Running   0          45m   10.244.0.40   minikube   <none>           <none>
mock-server-api-deployment-68bf6df6df-rrhj4   1/1     Running   0          45m   10.244.0.39   minikube   <none>           <none>
mock-server-api-deployment-68bf6df6df-s94h6   1/1     Running   0          45m   10.244.0.41   minikube   <none>           <none>
```

## (6) Gestión de pods y deployments (revisar estado, logs, eliminar)
Administración de PODs
| Comando                                        | Descripción                                                          |
|-----------------------------------------------|----------------------------------------------------------------------|
| `kubectl get pods`                             | Obtiene una lista de todos los pods en el clúster.                    |
| `kubectl describe pod <nombre-del-pod>`         | Muestra información detallada sobre un pod específico.                |
| `kubectl logs <nombre-del-pod>`                 | Muestra los registros (logs) de un pod específico.                    |
| `kubectl delete pod <nombre-del-pod>`           | Elimina un pod específico del clúster.                                |
| `kubectl delete pods --all`                     | Elimina todos los pods en el clúster.                                 |
| `kubectl apply -f <archivo-de-definicion.yaml>` | Crea o actualiza un pod utilizando un archivo de definición YAML.     |
| `kubectl exec -it <nombre-del-pod> -- <comando>` | Ejecuta un comando en un pod específico de forma interactiva.         |
| `kubectl port-forward <nombre-del-pod> <puerto>`| Redirige un puerto del pod a un puerto local para acceder al pod.     |

Administración de Deployments
| Comando                                               | Descripción                                                          |
|-------------------------------------------------------|----------------------------------------------------------------------|
| `kubectl get deployments`                              | Obtiene una lista de todos los deployments en el clúster.             |
| `kubectl describe deployment <nombre-del-deployment>`  | Muestra información detallada sobre un deployment específico.         |
| `kubectl scale deployment <nombre-del-deployment> ...` | Escala un deployment para aumentar o disminuir el número de réplicas. |
| `kubectl delete deployment <nombre-del-deployment>`    | Elimina un deployment específico del clúster.                         |
| `kubectl apply -f <archivo-de-definicion.yaml>`        | Crea o actualiza un deployment utilizando un archivo de definición YAML. |
| `kubectl rollout status deployment/<nombre-del-deployment>` | Verifica el estado de la implementación en curso de un deployment.  |
| `kubectl rollout history deployment/<nombre-del-deployment>` | Muestra el historial de implementaciones de un deployment.          |
| `kubectl rollout undo deployment/<nombre-del-deployment>`   | Revierte a una versión anterior de un deployment.                   |

Administración de Servicios
| Comando                                               | Descripción                                                          |
|-------------------------------------------------------|----------------------------------------------------------------------|
| `kubectl get services`                                  | Obtiene una lista de todos los servicios en el clúster.             |
| `kubectl describe service <nombre-del-servicio>`        | Muestra información detallada sobre un servicio específico.         |
| `kubectl delete service <nombre-del-servicio>`          | Elimina un servicio específico del clúster.                         |
| `kubectl apply -f <archivo-de-definicion.yaml>`         | Crea o actualiza un servicio utilizando un archivo de definición YAML. |
Administración de PV
| Comando                                               | Descripción                                                          |
|-------------------------------------------------------|----------------------------------------------------------------------|
| `kubectl create -f <archivo-de-definicion.yaml>`         | Crea un nuevo Persistent Volume (PV) utilizando un archivo de definición YAML. |
| `kubectl get pv`                                  | Obtiene una lista de todos los Persistent Volumes (PV) en el clúster.             |
| `kubectl describe pv <nombre-del-pv>`        | Muestra información detallada sobre un Persistent Volume (PV) específico.         |
| `kubectl delete pv <nombre-del-pv>`          | Elimina un Persistent Volume (PV) específico del clúster.                         |




## License

MIT



