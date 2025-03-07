FROM node:latest

WORKDIR /app

COPY package.json .
RUN npm i

COPY . .

EXPOSE 5173
ENTRYPOINT ["npm", "run", "dev"]