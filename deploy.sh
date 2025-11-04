#!/bin/bash

# Define variables
IMAGE_NAME="suuqfuran"
TAG="latest"
REMOTE_USER="root"
REMOTE_IP="45.130.164.209"
REMOTE_DIR="/root/suuqfuran"
DOCKERFILE_PATH="."
PORT_TO_RUN_ON=7777

docker run -d --name bazaryo -p ${PORT_TO_RUN_ON}:${PORT_TO_RUN_ON} bazaryo:latest

# Define the target platform
PLATFORM="linux/amd64" # Change this to "linux/arm64" if the target is an ARM architecture

# Build the Docker image with the specified platform
docker build --platform ${PLATFORM} -t ${IMAGE_NAME}:${TAG} ${DOCKERFILE_PATH}

echo "Docker image built successfully."
# Save the Docker image to a tar file
docker save -o ${IMAGE_NAME}.tar ${IMAGE_NAME}:${TAG}

echo "Docker image saved to a tar file successfully."
# Copy the tar file to the remote server
scp ${IMAGE_NAME}.tar ${REMOTE_USER}@${REMOTE_IP}:${REMOTE_DIR}

echo "Docker image copied to the remote server successfully."
# Connect to the remote server and load the Docker image
ssh ${REMOTE_USER}@${REMOTE_IP} << EOF
  cd ${REMOTE_DIR}
  docker load -i ${IMAGE_NAME}.tar

  # Stop and remove existing container if it exists
  if [ \$(docker ps -a -q -f name=${IMAGE_NAME}) ]; then
    docker stop ${IMAGE_NAME}
    docker rm ${IMAGE_NAME}
  fi

  docker run -d --name ${IMAGE_NAME} -p ${PORT_TO_RUN_ON}:${PORT_TO_RUN_ON} ${IMAGE_NAME}:${TAG} 

  # Check if the container is running
  if [ \$(docker ps -q -f name=${IMAGE_NAME}) ]; then
    echo "Container ${IMAGE_NAME} is running."
  else
    echo "Container ${IMAGE_NAME} failed to start."
    echo "Checking container logs..."
    docker logs ${IMAGE_NAME}
  fi
EOF

# Clean up the local tar file
rm ${IMAGE_NAME}.tar

echo "Deployment completed."
