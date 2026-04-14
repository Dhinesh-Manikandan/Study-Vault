package com.studyvault.config;

import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

import javax.sql.DataSource;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

@Configuration
public class DatabaseConfig {

    private static final String DEFAULT_JDBC_URL = "jdbc:postgresql://localhost:5432/studyvault?sslmode=require&prepareThreshold=0";
    private static final String DEFAULT_USERNAME = "postgres";
    private static final String DEFAULT_PASSWORD = "postgres";

    @Bean
    @Primary
    public DataSource dataSource(Environment environment) {
        ResolvedDatabaseSettings settings = resolveSettings(environment);

        HikariConfig config = new HikariConfig();
        config.setDriverClassName("org.postgresql.Driver");
        config.setJdbcUrl(settings.jdbcUrl());

        if (settings.username() != null) {
            config.setUsername(settings.username());
        }

        if (settings.password() != null) {
            config.setPassword(settings.password());
        }

        config.setMaximumPoolSize(5);
        config.setMinimumIdle(1);
        config.setConnectionTimeout(30000);

        return new HikariDataSource(config);
    }

    private ResolvedDatabaseSettings resolveSettings(Environment environment) {
        String springDatasourceUrl = trimToNull(environment.getProperty("SPRING_DATASOURCE_URL"));
        if (springDatasourceUrl != null) {
            return fromUrl(springDatasourceUrl, environment);
        }

        String jdbcDatabaseUrl = trimToNull(environment.getProperty("JDBC_DATABASE_URL"));
        if (jdbcDatabaseUrl != null) {
            return fromUrl(jdbcDatabaseUrl, environment);
        }

        String databaseUrl = trimToNull(environment.getProperty("DATABASE_URL"));
        if (databaseUrl != null) {
            return fromUrl(databaseUrl, environment);
        }

        return new ResolvedDatabaseSettings(DEFAULT_JDBC_URL, DEFAULT_USERNAME, DEFAULT_PASSWORD);
    }

    private ResolvedDatabaseSettings fromUrl(String rawUrl, Environment environment) {
        String jdbcUrl = normalizeJdbcUrl(rawUrl);
        String explicitUsername = trimToNull(environment.getProperty("SPRING_DATASOURCE_USERNAME"));
        String explicitPassword = trimToNull(environment.getProperty("SPRING_DATASOURCE_PASSWORD"));
        String parsedUsername = extractUserInfo(rawUrl, true);
        String parsedPassword = extractUserInfo(rawUrl, false);

        return new ResolvedDatabaseSettings(
            jdbcUrl,
            explicitUsername != null ? explicitUsername : parsedUsername,
            explicitPassword != null ? explicitPassword : parsedPassword
        );
    }

    private String normalizeJdbcUrl(String rawUrl) {
        String trimmedUrl = trimToNull(rawUrl);
        if (trimmedUrl == null) {
            return DEFAULT_JDBC_URL;
        }

        if (trimmedUrl.startsWith("jdbc:")) {
            return trimmedUrl;
        }

        if (trimmedUrl.startsWith("postgres://")) {
            return "jdbc:postgresql://" + trimmedUrl.substring("postgres://".length());
        }

        if (trimmedUrl.startsWith("postgresql://")) {
            return "jdbc:postgresql://" + trimmedUrl.substring("postgresql://".length());
        }

        return trimmedUrl;
    }

    private String extractUserInfo(String rawUrl, boolean username) {
        try {
            URI uri = new URI(stripJdbcPrefix(rawUrl));
            String userInfo = uri.getUserInfo();
            if (userInfo == null || userInfo.isBlank()) {
                return null;
            }

            int separatorIndex = userInfo.indexOf(':');
            String value = username
                ? (separatorIndex >= 0 ? userInfo.substring(0, separatorIndex) : userInfo)
                : (separatorIndex >= 0 ? userInfo.substring(separatorIndex + 1) : null);

            return trimToNull(decode(value));
        } catch (URISyntaxException ex) {
            return null;
        }
    }

    private String stripJdbcPrefix(String rawUrl) {
        String trimmedUrl = trimToNull(rawUrl);
        if (trimmedUrl == null) {
            return DEFAULT_JDBC_URL;
        }

        return trimmedUrl.startsWith("jdbc:") ? trimmedUrl.substring("jdbc:".length()) : trimmedUrl;
    }

    private String decode(String value) {
        if (value == null) {
            return null;
        }

        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmedValue = value.trim();
        return trimmedValue.isEmpty() ? null : trimmedValue;
    }

    private record ResolvedDatabaseSettings(String jdbcUrl, String username, String password) {
    }
}