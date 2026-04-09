package com.studyvault.config;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class ItemSchemaUpdater {

    private final JdbcTemplate jdbcTemplate;

    public ItemSchemaUpdater(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void ensureItemColumnCapacity() {
        jdbcTemplate.execute("ALTER TABLE IF EXISTS items ALTER COLUMN url TYPE VARCHAR(2048)");
        jdbcTemplate.execute("ALTER TABLE IF EXISTS items ALTER COLUMN file_url TYPE VARCHAR(2048)");
        jdbcTemplate.execute("ALTER TABLE IF EXISTS items ALTER COLUMN content TYPE TEXT");
        jdbcTemplate.execute("ALTER TABLE IF EXISTS items ALTER COLUMN notes TYPE TEXT");
    }
}
