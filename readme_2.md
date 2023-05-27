## Construir la imagen a partir del dockerfile
> docker build -t innovadeveloper/mock-server-api:latest -f devops/Dockerfile .


## Crear un namespace
kubectl create namespace MY-NAMESPACE

## Listar namespaces
kubectl get namespaces


## Aplicar deployment
kubectl apply -f DEPLOYMENT-FILE -n MY-NAMESPACE
> kubectl apply -f ./devops/deployment.yaml -n mock-server-namespace

## Listar deployments
kubectl get deployments -o wide -n MY-NAMESPACE
> kubectl get deployments -o wide -n mock-server-namespace

## Describir el deployment
kubectl describe deployment DEPLOYMENT-NAME

## Eliminar el deployment creado
kubectl delete deployment DEPLOYMENT_NAME
> kubectl delete deployment mock-server-api-deployment -n mock-server-namespace

## Eliminar el pv
kubectl delete pv my-pv

## Crear el pvc
kubectl apply -f devops/pvc.yaml

## Crear el service
kubectl apply -f devops/service.yaml

## Descubrir la ip de la máquina virtual de microk8s en macOS
kubectl describe node

## Instalar addons (storage, dashboard)
microk8s enable dns dashboard storage

## Habilitar el dashboard
multipass exec microk8s-vm -- sudo /snap/bin/microk8s kubectl -n kube-system describe secret $(multipass exec microk8s-vm -- sudo /snap/bin/microk8s kubectl -n kube-system get secret | grep default-token | cut -d " " -f1)