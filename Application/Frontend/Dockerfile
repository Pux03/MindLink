# Faza 1: Build aplikacije
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# Vite build generiše fajlove u "dist" folderu
RUN npm run build

# Faza 2: Serviranje statičkih fajlova kroz Nginx
FROM nginx:stable-alpine
# Kopiramo buildovane fajlove iz prethodne faze u Nginx HTML folder
COPY --from=build /app/dist /usr/share/nginx/html

# Otvaramo standardni HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]