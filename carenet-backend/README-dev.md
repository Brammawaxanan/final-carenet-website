Local dev run options

1) Recommended: create a dedicated MySQL user and database

From PowerShell (assumes `mysql` client is on PATH). Replace the 'root' password prompt as needed.

```powershell
mysql -u root -p -h 127.0.0.1 -P 3306
-- then at mysql> prompt run:
CREATE DATABASE IF NOT EXISTS CareNet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'carenet_user'@'localhost' IDENTIFIED BY 'ChangeMe@123';
GRANT ALL PRIVILEGES ON CareNet.* TO 'carenet_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Then in `src/main/resources/application.properties` update the datasource username/password:

spring.datasource.username=carenet_user
spring.datasource.password=ChangeMe@123

Restart the Spring Boot application.

2) Fast alternative: run with an in-memory H2 DB (no MySQL required)

I added `src/main/resources/application-dev.properties`. To run the app with H2 in-memory DB:

```powershell
# From project root
# Windows PowerShell
mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev
# or if running from your IDE, set active profile to 'dev'
```

Open the H2 console at http://localhost:8091/h2-console and use JDBC URL `jdbc:h2:mem:carenet`, user `sa`, empty password.

Notes
- Prefer a dedicated DB user to avoid using root in app configs.
- Do not commit production credentials into VCS. Use environment variables or profile-specific properties excluded from git for secrets.