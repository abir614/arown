FROM node:lts-alpine
RUN npm install express body-parser multer uuid
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
