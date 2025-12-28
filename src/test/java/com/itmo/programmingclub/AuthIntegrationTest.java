package com.itmo.programmingclub;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.itmo.programmingclub.model.dto.AuthRequest;
import com.itmo.programmingclub.model.dto.RegisterRequest;
import com.itmo.programmingclub.model.RoleEnum;
import com.itmo.programmingclub.model.entity.Role;
import com.itmo.programmingclub.model.entity.User;
import com.itmo.programmingclub.model.entity.UserRole;
import com.itmo.programmingclub.repository.UserRepository;
import com.itmo.programmingclub.repository.UserRoleRepository;
import com.itmo.programmingclub.service.ManagerActivationService;
import com.itmo.programmingclub.service.UserRegistrationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class AuthIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private UserRoleRepository userRoleRepository;

    @MockitoBean
    private UserRegistrationService userRegistrationService;

    @MockitoBean
    private ManagerActivationService managerActivationService;

    private void mockUserDoesNotExist() {
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
    }

    private void createMockUser(String username, String rawPassword, String roleName, boolean isActive) {
        User user = new User();
        user.setId(1);
        user.setUsername(username);
        user.setEmail(username + "@mail.com");
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setIsActive(isActive);
        user.setRegistrationDate(OffsetDateTime.now());

        Role role = new Role();
        role.setId(1);
        role.setRole(RoleEnum.valueOf(roleName));

        UserRole userRole = new UserRole();
        userRole.setRole(role);
        userRole.setUser(user);
        user.setUserRoles(Collections.singleton(userRole));

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(userRoleRepository.findByUserId(user.getId())).thenReturn(Collections.singletonList(userRole));
    }

    private String obtainToken(String username, String password) throws Exception {
        AuthRequest loginRequest = new AuthRequest(username, password);
        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response).get("token").asText();
    }

    @Test
    void shouldRegisterStudentSuccessfully() throws Exception {
        RegisterRequest request = new RegisterRequest("student1", "pass", "s@m.ru", "Name", RoleEnum.STUDENT);
        mockUserDoesNotExist();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        verify(userRegistrationService).registerUser(anyString(), anyString(), anyString(), anyString(), eq("STUDENT"));
    }

    @Test
    void shouldRegisterCuratorSuccessfully() throws Exception {
        RegisterRequest request = new RegisterRequest("curator1", "pass", "c@m.ru", "Name", RoleEnum.CURATOR);
        mockUserDoesNotExist();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        verify(userRegistrationService).registerUser(anyString(), anyString(), anyString(), anyString(), eq("CURATOR"));
    }

    @Test
    void shouldRegisterManagerSuccessfully() throws Exception {
        RegisterRequest request = new RegisterRequest("manager1", "pass", "m@m.ru", "Name", RoleEnum.MANAGER);
        mockUserDoesNotExist();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        verify(userRegistrationService).registerUser(anyString(), anyString(), anyString(), anyString(), eq("MANAGER"));
    }

    @Test
    void shouldFailRegistrationIfUsernameTaken() throws Exception {
        RegisterRequest request = new RegisterRequest("takenUser", "pass", "new@m.ru", "Name", RoleEnum.STUDENT);

        when(userRepository.existsByUsername("takenUser")).thenReturn(true);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorMessage").value("Username is already taken!"));
    }

    @Test
    void shouldFailRegistrationIfEmailTaken() throws Exception {
        RegisterRequest request = new RegisterRequest("user", "pass", "taken@m.ru", "Name", RoleEnum.STUDENT);

        when(userRepository.existsByEmail("taken@m.ru")).thenReturn(true);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorMessage").value("Email is already in use!"));
    }

    @Test
    void shouldFailRegistrationWithEmptyFields() throws Exception {
        RegisterRequest request = new RegisterRequest("", "pass", "valid@m.ru", "Name", RoleEnum.STUDENT);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldFailRegistrationWithInvalidEmail() throws Exception {
        RegisterRequest request = new RegisterRequest("user", "pass", "not-an-email", "Name", RoleEnum.STUDENT);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldLoginSuccessfully() throws Exception {
        createMockUser("validUser", "password123", "STUDENT", true);
        AuthRequest login = new AuthRequest("validUser", "password123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.username").value("validUser"));
    }

    @Test
    void shouldFailLoginIfUserNotFound() throws Exception {
        AuthRequest login = new AuthRequest("ghost", "pass");

        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldFailLoginWithWrongPassword() throws Exception {
        createMockUser("user", "correctPass", "STUDENT", true);
        AuthRequest login = new AuthRequest("user", "WRONG_PASS");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldLoginManagerSuccessfully() throws Exception {
        createMockUser("activeManager", "secret", "MANAGER", true);
        AuthRequest login = new AuthRequest("activeManager", "secret");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roles[0]").value("MANAGER"));
    }

    @Test
    void shouldFailLoginIfManagerIsInactive() throws Exception {
        createMockUser("inactiveManager", "pass", "MANAGER", false);
        AuthRequest login = new AuthRequest("inactiveManager", "pass");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorMessage").value("User is disabled"));
    }

    @Test
    void shouldDenyAccessWithoutToken() throws Exception {
        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldAllowAccessWithToken() throws Exception {
        createMockUser("student", "pass", "STUDENT", true);

        String token = obtainToken("student", "pass");

        mockMvc.perform(get("/api/tasks")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void shouldFailRegistrationWithSpaceInUsername() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "User Name",
                "password123",
                "valid@mail.ru",
                "Ivan Ivanov",
                RoleEnum.STUDENT
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorMessage").value("Username must not contain spaces or special characters"));
    }

    @Test
    void shouldFailRegistrationWithTabInPassword() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "validUser",
                "pass\tword",
                "valid@mail.ru",
                "Ivan Ivanov",
                RoleEnum.STUDENT
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorMessage").value("Password must not contain whitespace"));
    }

    @Test
    void shouldFailRegistrationWithNewlineInEmail() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "validUser",
                "password123",
                "te\nst@mail.ru",
                "Ivan Ivanov",
                RoleEnum.STUDENT
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldFailRegistrationWithTrailingSpaceInEmail() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "validUser",
                "password123",
                "test@mail.ru ",
                "Ivan Ivanov",
                RoleEnum.STUDENT
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldFailRegistrationWithDigitsInFullName() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "validUser",
                "password123",
                "valid@mail.ru",
                "Ivan777",
                RoleEnum.STUDENT
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorMessage").value("Full name can only contain letters, spaces, hyphens and apostrophes"));
    }

    @Test
    void shouldFailRegistrationWithSpecialCharsInFullName() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "validUser",
                "password123",
                "valid@mail.ru",
                "Ivan_Ivanov",
                RoleEnum.STUDENT
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectRequestWithMalformedToken() throws Exception {
        mockMvc.perform(get("/api/tasks")
                        .header("Authorization", "Bearer abrakadabra.invalid.token"))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldRejectRequestWithTokenWithoutBearerPrefix() throws Exception {
        createMockUser("user", "pass", "STUDENT", true);
        String token = "valid.jwt.token";

        mockMvc.perform(get("/api/tasks")
                        .header("Authorization", token))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldDenyStudentAccessToManagerResource() throws Exception {
        createMockUser("student1", "pass", "STUDENT", true);
        String token = obtainToken("student1", "pass");

        mockMvc.perform(get("/api/managers/inactive")
                        .header("Authorization", "Bearer " + token))
                .andDo(print())
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldDenyCuratorAccessToManagerResource() throws Exception {
        createMockUser("curator1", "pass", "CURATOR", true);
        String token = obtainToken("curator1", "pass");

        mockMvc.perform(get("/api/managers/inactive")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldAllowActiveManagerAccessToManagerResource() throws Exception {
        createMockUser("activeManager", "pass", "MANAGER", true);
        String token = obtainToken("activeManager", "pass");

        when(userRepository.findInactiveManagers(any(Pageable.class)))
                .thenReturn(Page.empty());

        mockMvc.perform(get("/api/managers/inactive")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }
}