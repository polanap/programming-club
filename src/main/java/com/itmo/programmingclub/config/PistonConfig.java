package com.itmo.programmingclub.config;

import com.github.codeboy.piston4j.api.Piston;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PistonConfig {

    @Bean
    public Piston piston() {
        return Piston.getDefaultApi();
    }
}
