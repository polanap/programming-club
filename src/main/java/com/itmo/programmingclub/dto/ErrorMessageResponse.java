package com.itmo.programmingclub.dto;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
public class ErrorMessageResponse {
    private String errorMessage = null;

    public ErrorMessageResponse (String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public String getErrorMessage() {
        return errorMessage;
    }


}