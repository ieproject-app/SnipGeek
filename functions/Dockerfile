# Use the official Node.js 20 image as a base, which matches the function's runtime.
FROM node:20

# Set the working directory in the container.
WORKDIR /usr/src/app

# Install Ghostscript, which is required for PDF compression.
# Running apt-get update and then installing cleans up the cache in the same layer.
RUN apt-get update && apt-get install -y ghostscript && rm -rf /var/lib/apt/lists/*

# Copy the package.json and package-lock.json (if available) files.
COPY package*.json ./

# Install application dependencies based on the package.json.
RUN npm install

# Copy the rest of the application source code from your local 'functions' directory.
COPY . .

# Expose the port the app runs on (though Cloud Functions handles this automatically).
EXPOSE 8080

# The command to run the application, which will be managed by the Cloud Functions environment.
CMD ["npm", "start"]
