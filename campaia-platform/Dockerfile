# ==============================
# STAGE 1: Build (Construire)
# ==============================
# Folosim o imagine Node LTS (Long Term Support) pentru a construi aplicația
FROM node:20-alpine3.20 AS build

WORKDIR /app

# Copiem fișierele de management al pachetelor
COPY package.json package-lock.json ./

# Instalăm dependențele
RUN npm install

# Copiem restul codului sursă
COPY . .

# Rulăm scriptul de build (definit în package.json)
# Acesta va crea folderul /app/dist cu fișierele statice
RUN npm run build

# ==============================
# STAGE 2: Serve (Servire)
# ==============================
# Folosim o imagine Nginx oficială și foarte mică
FROM nginx:1.27-alpine

# Ștergem conținutul Nginx implicit
RUN rm -rf /usr/share/nginx/html/*

# Copiem fișierele statice construite în STAGE 1 (din /app/dist)
# în folderul public al Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Opțional: Adaugă o configurație Nginx pentru a funcționa corect cu React Router
# (dacă folosești React Router)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expunem portul 80 (standard pentru Nginx)
EXPOSE 80

# Comanda Nginx de pornire
CMD ["nginx", "-g", "daemon off;"]