FROM node:20-alpine
WORKDIR /app
COPY game-server-package.json ./package.json
RUN npm install --omit=dev
COPY game-server.js server-sim.js server-room.js ./
ENV PORT=8080
EXPOSE 8080
CMD ["node","game-server.js"]
