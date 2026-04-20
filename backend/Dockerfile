FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 7860
ENV PORT=7860
CMD ["node", "app.js"]
