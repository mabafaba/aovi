FROM node:22

# Set the working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the application files
COPY . .

# Copy the script to generate secret JWT token (user data encryption) and make it executable
# COPY generate_secret_JWT.sh .
# RUN chmod +x generate_secret_JWT.sh


# Expose the port your app is running on
EXPOSE 3000

# Command to run your application
CMD ["npm", "start"]
