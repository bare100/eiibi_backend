#!/bin/bash

# Define variables
SERVER_IP="your-server-ip"
SERVER_USER="your-username"
REMOTE_DIR="/home/$SERVER_USER/your-project-folder"
LOCAL_BUILD_DIR="dist"
APP_ZIP="app.zip"
ECOSYSTEM_FILE="ecosystem.config.cjs"

# Stop on errors
set -e

echo "Ensuring the remote directory exists..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $REMOTE_DIR"

# Step 1: Build the Node.js app
echo "Building the Node.js app..."
yarn install
npm run build

# Step 2: Zip the built files (excluding node_modules)
echo "Creating zip file..."
rm -f $APP_ZIP
if [ -f "service-account.json" ]; then
  if [ -d ".adminjs" ]; then
    zip -r $APP_ZIP $LOCAL_BUILD_DIR service-account.json .adminjs package.json yarn.lock $ECOSYSTEM_FILE
  else
    zip -r $APP_ZIP $LOCAL_BUILD_DIR service-account.json package.json yarn.lock $ECOSYSTEM_FILE
  fi
else
  if [ -d ".adminjs" ]; then
    zip -r $APP_ZIP $LOCAL_BUILD_DIR .adminjs package.json yarn.lock $ECOSYSTEM_FILE
  else
    zip -r $APP_ZIP $LOCAL_BUILD_DIR package.json yarn.lock $ECOSYSTEM_FILE
  fi
fi

# Step 3: Push the zip to the server
echo "Uploading zip to server..."
scp $APP_ZIP $SERVER_USER@$SERVER_IP:$REMOTE_DIR/

# Step 4: Connect to the server, unzip, and run the app
echo "Deploying on server..."
ssh $SERVER_USER@$SERVER_IP << EOF
    set -e

    echo "Checking if 'unzip' is installed..."
    if ! command -v unzip &> /dev/null; then
        echo "'unzip' not found. Installing..."
        sudo apt update
        sudo apt install unzip -y
    fi

    echo "Checking if 'yarn' is installed..."
    if ! command -v yarn &> /dev/null; then
        echo "'yarn' not found. Installing..."
        curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
        echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
        sudo apt update
        sudo apt install yarn -y
    fi

    echo "Checking if 'pm2' is installed..."
    if ! command -v pm2 &> /dev/null; then
        echo "'pm2' not found. Installing globally using npm..."
        sudo npm install -g pm2
    fi

    echo "Navigating to remote directory..."
    mkdir -p $REMOTE_DIR
    cd $REMOTE_DIR

    echo "Unzipping the application..."
    rm -rf $LOCAL_BUILD_DIR
    unzip -o $APP_ZIP

    echo "Installing dependencies on the server..."
    yarn install --production

    echo "Starting the app with pm2..."
    pm2 delete all || true

    echo "Starting the app with pm2 using $ECOSYSTEM_FILE..."
    pm2 startOrReload $ECOSYSTEM_FILE

    echo "Deployment completed!"
EOF

# Step 5: Clean up local zip file
rm -f $APP_ZIP
