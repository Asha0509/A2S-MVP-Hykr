# A2S Backend (Spring Boot)

This is the converted Spring Boot backend for A2S.

## Generic Setup
1. Install Java 17+ and Maven.
2. Configure **MongoDB** connection in `src/main/resources/application.properties`.
   - Set `MONGO_URI` environment variable or edit the file directly.
3. Configure **JWT_SECRET** in `application.properties` or environment.
4. Configure **PEMINI_API_KEY** for Chat features.

## Running the App
```bash
mvn spring-boot:run
```

## Endpoints
- **Auth**: `/api/users/login`, `/api/users/register`
- **User**: `/api/users/profile`, `/api/users/saved-designs`
- **Designs**: `/api/designs`, `/api/designs/{id}`, `/api/designs/room/{type}`, `/api/designs/style/{style}`
- **Chat**: `/api/chat/consultant`, `/api/chat/vastu`
