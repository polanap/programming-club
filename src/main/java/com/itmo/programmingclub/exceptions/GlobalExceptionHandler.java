package com.itmo.programmingclub.exceptions;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import com.itmo.programmingclub.model.dto.ErrorMessageResponse;

import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // @ExceptionHandler
    // public ResponseEntity<ErrorMessageResponse> handleIllegalArgumentException(IllegalArgumentException e) {
    //     return ResponseEntity.badRequest().body(createAndLogError("Bad Request: " + e.getMessage(), e));
    // }

    // @ExceptionHandler
    // public ResponseEntity<ErrorMessageResponse> handleMethodArgumentNotValidException(MethodArgumentNotValidException e) {
    //     String errorMessage = "Validation failed: " + e.getBindingResult().getAllErrors().stream()
    //             .map(error -> error.getDefaultMessage())
    //             .collect(Collectors.joining(", "));
    //     return ResponseEntity.badRequest().body(createAndLogError(errorMessage, e));
    // }

    // @ExceptionHandler
    // public ResponseEntity<ErrorMessageResponse> handleHttpMessageNotReadableException(HttpMessageNotReadableException e) {
    //     return ResponseEntity.badRequest().body(createAndLogError("Bad Request: " + e.getMessage(), e));
    // }

    // @ExceptionHandler
    // public ResponseEntity<ErrorMessageResponse> handleNoSuchElementException(NoSuchElementException e) {
    //     return ResponseEntity.notFound().build();
    // }

    // @ExceptionHandler
    // public ResponseEntity<ErrorMessageResponse> handleBadCredentialsException(BadCredentialsException e) {
    //     return ResponseEntity.status(401).body(createAndLogError("Bad credentials", e));
    // }

    @ExceptionHandler
    public ResponseEntity<ErrorMessageResponse> handleOtherException(RuntimeException e) {
        
        return ResponseEntity.internalServerError().body(createAndLogError("Internal Server Error", e));
    }

    @ExceptionHandler
    public ResponseEntity<ErrorMessageResponse> handleUsernameNotFoundException(UsernameNotFoundException e) {
        return ResponseEntity.status(401).body(createAndLogError("Bad credentials", e));
    }

    @ExceptionHandler
    public ResponseEntity<ErrorMessageResponse> handleIllegalArgumentException(IllegalArgumentException e) {
        return ResponseEntity.status(400).body(createAndLogError(e.getMessage(), e));
    }

    @ExceptionHandler
    public ResponseEntity<ErrorMessageResponse> handleDisabledException(DisabledException e) {
        return ResponseEntity.status(403).body(createAndLogError(e.getMessage(), e));
    }

    @ExceptionHandler
    public ResponseEntity<ErrorMessageResponse> handleBadCredentialsException(BadCredentialsException e) {
        return ResponseEntity.status(401).body(createAndLogError(e.getMessage(), e));
    }

    @ExceptionHandler
    public ResponseEntity<ErrorMessageResponse> handleValidationException(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getAllErrors().stream()
                .map(DefaultMessageSourceResolvable::getDefaultMessage)
                .collect(Collectors.joining(", "));

        return ResponseEntity.badRequest().body(new ErrorMessageResponse(message));
    }

    private ErrorMessageResponse createAndLogError(String message, Throwable e) {
        log.error(message, e);
        return new ErrorMessageResponse(message);
    }
}

