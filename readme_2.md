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