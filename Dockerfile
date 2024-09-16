FROM node:lts-alpine
RUN npm install
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
