package com.school.management.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    @Value("${spring.datasource.url}")
    private String dbUrl;

    @Value("${spring.datasource.username:}")
    private String dbUsername;

    @Value("${spring.datasource.password:}")
    private String dbPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        
        String url = dbUrl;
        String username = dbUsername;
        String password = dbPassword;

        // Automatically handle Railway/Heroku postgresql:// or postgres:// DATABASE_URL formats
        if (url != null && (url.startsWith("postgres://") || url.startsWith("postgresql://"))) {
            try {
                URI uri = new URI(url);
                String userInfo = uri.getUserInfo();
                if (userInfo != null && userInfo.contains(":")) {
                    String[] parts = userInfo.split(":", 2);
                    username = parts[0];
                    password = parts[1];
                }
                String host = uri.getHost();
                int port = uri.getPort() != -1 ? uri.getPort() : 5432;
                String path = uri.getPath();
                String query = uri.getQuery();
                
                url = "jdbc:postgresql://" + host + ":" + port + path + (query != null ? "?" + query : "");
            } catch (Exception e) {
                if (url.startsWith("postgres://")) {
                    url = "jdbc:postgresql://" + url.substring("postgres://".length());
                } else if (url.startsWith("postgresql://")) {
                    url = "jdbc:postgresql://" + url.substring("postgresql://".length());
                }
            }
        }

        config.setJdbcUrl(url);
        if (username != null && !username.isBlank()) {
            config.setUsername(username);
        }
        if (password != null && !password.isBlank()) {
            config.setPassword(password);
        }
        config.setDriverClassName("org.postgresql.Driver");
        return new HikariDataSource(config);
    }
}
