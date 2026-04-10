# Multi-stage build for Spring Boot backend on Render
FROM maven:3.9.8-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Render injects PORT at runtime; application.properties maps it to server.port
EXPOSE 8080
CMD ["sh", "-c", "java -jar app.jar"]
