package com.itmo.programmingclub.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.ZoneId;

@Configuration
public class TimeConfig {

    @Value("${app.timezone:Europe/Moscow}")
    private String timezone;

    @Bean
    public ZoneId appZoneId() {
        return ZoneId.of(timezone);
    }
}