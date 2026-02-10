package com.itmo.programmingclub.model;

public enum ProgrammingLanguage {
    JAVA,
    PYTHON;
    
    @Override
    public String toString() {
        return name().toLowerCase();
    }
    
    public static ProgrammingLanguage fromString(String value) {
        if (value == null) {
            return null;
        }
        try {
            return valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    public static ProgrammingLanguage getDefault() {
        return JAVA;
    }
}
