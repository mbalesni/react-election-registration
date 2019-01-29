FROM node:8

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . .

# set ENV variables in `.env`
# required variables' defaults:
# REACT_APP_BACKEND_BASE_URL=http://localhost:8011
#
#
ENV PORT=8000
EXPOSE 8000
CMD [ "npm", "start" ]
