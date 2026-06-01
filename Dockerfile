# 빌드 스테이지: node로 정적 번들 생성
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 런타임 스테이지: nginx로 정적 파일 서빙 (시스템 설계의 Frontend 컨테이너)
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
