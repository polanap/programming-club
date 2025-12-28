package com.itmo.programmingclub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ProgrammingClubApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProgrammingClubApplication.class, args);
    }

}
