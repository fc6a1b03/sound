FROM caddy:builder-alpine
WORKDIR /usr/share/caddy
COPY index.html index.js index.css ./
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 80
