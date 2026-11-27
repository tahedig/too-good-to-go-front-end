FROM node:22.22.3-alpine3.22 AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=/api
ARG VITE_APP_NAME=crumb
ARG VITE_SUPPORT_EMAIL=support@example.com
ARG VITE_PROFILE_API_MODE=remote
ARG APP_VERSION=develop
ARG VCS_REF=unknown
ARG BUILD_DATE=unknown

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_SUPPORT_EMAIL=$VITE_SUPPORT_EMAIL
ENV VITE_PROFILE_API_MODE=$VITE_PROFILE_API_MODE

RUN npm run build \
    && printf '{"version":"%s","commit":"%s"}\n' "$APP_VERSION" "$VCS_REF" > dist/version.json


FROM nginx:1.31.10-alpine3.24 AS production

ARG APP_VERSION=develop
ARG VCS_REF=unknown
ARG BUILD_DATE=unknown

LABEL org.opencontainers.image.title="Tahe Dig Frontend" \
      org.opencontainers.image.version=$APP_VERSION \
      org.opencontainers.image.revision=$VCS_REF \
      org.opencontainers.image.created=$BUILD_DATE

ENV BACKEND_UPSTREAM=http://host.docker.internal:8080 \
    NGINX_ENVSUBST_FILTER=BACKEND_UPSTREAM

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
