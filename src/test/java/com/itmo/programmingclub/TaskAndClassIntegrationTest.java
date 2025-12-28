package com.itmo.programmingclub;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.itmo.programmingclub.model.RoleEnum;
import com.itmo.programmingclub.model.dto.TaskDTO;
import com.itmo.programmingclub.model.dto.TestDTO;
import com.itmo.programmingclub.model.entity.*;
import com.itmo.programmingclub.model.entity.Class;
import com.itmo.programmingclub.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.HashSet;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class TaskAndClassIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private UserRepository userRepository;
    @MockitoBean
    private TaskRepository taskRepository;
    @MockitoBean
    private TestRepository testRepository;
    @MockitoBean
    private ClassRepository classRepository;
    @MockitoBean
    private ScheduleRepository scheduleRepository;

    private User curator;
    private User student;
    private Task task;
    private Class classEntity;

    @BeforeEach
    void setUp() {
        curator = new User();
        curator.setId(1);
        curator.setUsername("curator");
        Role roleCurator = new Role();
        roleCurator.setRole(RoleEnum.MANAGER);
        UserRole ur1 = new UserRole();
        ur1.setRole(roleCurator);
        ur1.setUser(curator);
        curator.setUserRoles(new HashSet<>(Collections.singletonList(ur1)));

        student = new User();
        student.setId(2);
        student.setUsername("student");
        Role roleStudent = new Role();
        roleStudent.setRole(RoleEnum.STUDENT);
        UserRole ur2 = new UserRole();
        ur2.setRole(roleStudent);
        ur2.setUser(student);
        student.setUserRoles(new HashSet<>(Collections.singletonList(ur2)));

        task = new Task();
        task.setId(10);
        task.setCondition("Original Task Condition");
        task.setIsOpen(true);
        task.setAuthor(curator);

        classEntity = new Class();
        classEntity.setId(100);
        classEntity.setTasks(new HashSet<>());

        when(userRepository.findByUsername("curator")).thenReturn(Optional.of(curator));
        when(userRepository.findByUsername("student")).thenReturn(Optional.of(student));
    }


    @Test
    @WithMockUser(username = "curator", roles = "CURATOR")
    void shouldCreateTaskSuccessfullyByCurator() throws Exception {
        TaskDTO dto = new TaskDTO("Curator Task", true);

        when(taskRepository.save(any(Task.class))).thenAnswer(i -> {
            Task t = i.getArgument(0);
            t.setId(1);
            return t;
        });

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.condition").value("Curator Task"))
                .andExpect(jsonPath("$.author.username").value("curator"));
    }

    @Test
    @WithMockUser(username = "student", roles = "STUDENT")
    void shouldCreateTaskSuccessfullyByStudent() throws Exception {
        TaskDTO dto = new TaskDTO("Student Task", false);

        when(taskRepository.save(any(Task.class))).thenAnswer(i -> {
            Task t = i.getArgument(0);
            t.setId(2);
            t.setAuthor(student);
            return t;
        });

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.condition").value("Student Task"))
                .andExpect(jsonPath("$.author.username").value("student"));
    }

    @Test
    @WithMockUser(username = "curator", roles = "CURATOR")
    void shouldFailToCreateTaskWithEmptyCondition() throws Exception {
        TaskDTO dto = new TaskDTO("", true);

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }


    @Test
    @WithMockUser(username = "curator", roles = "CURATOR")
    void shouldCreateTestForOwnTask() throws Exception {
        when(taskRepository.findById(10)).thenReturn(Optional.of(task));

        when(testRepository.save(any(com.itmo.programmingclub.model.entity.Test.class)))
                .thenAnswer(i -> {
                    com.itmo.programmingclub.model.entity.Test t = i.getArgument(0);
                    t.setId(50);
                    return t;
                });

        TestDTO testDto = new TestDTO("input", "output");

        mockMvc.perform(post("/api/tasks/10/tests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(50))
                .andExpect(jsonPath("$.input").value("input"));
    }

    @Test
    @WithMockUser(username = "curator", roles = "CURATOR")
    void shouldFailToCreateTestWithEmptyInput() throws Exception {
        TestDTO testDto = new TestDTO("", "output");

        mockMvc.perform(post("/api/tasks/10/tests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testDto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "student", roles = "STUDENT")
    void shouldFailToAddTestToOthersTask() throws Exception {
        when(taskRepository.findById(10)).thenReturn(Optional.of(task));

        TestDTO testDto = new TestDTO("input", "output");

        mockMvc.perform(post("/api/tasks/10/tests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testDto)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorMessage").value("You can only add tests to your own tasks"));
    }

    @Test
    @WithMockUser(username = "curator", roles = "CURATOR")
    void shouldFailToAddTestToNonExistentTask() throws Exception {
        when(taskRepository.findById(999)).thenReturn(Optional.empty());

        TestDTO testDto = new TestDTO("input", "output");

        mockMvc.perform(post("/api/tasks/999/tests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testDto)))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "curator", roles = "CURATOR")
    void shouldAssignTaskToClassSuccessfully() throws Exception {
        when(classRepository.findById(100)).thenReturn(Optional.of(classEntity));
        when(taskRepository.findById(10)).thenReturn(Optional.of(task));

        mockMvc.perform(post("/api/classes/100/tasks/10"))
                .andExpect(status().isOk());

        verify(classRepository).save(any(Class.class));
        assertEquals(1, classEntity.getTasks().size());
    }

    @Test
    @WithMockUser(username = "curator", roles = "CURATOR")
    void shouldFailAssignIfTaskNotFound() throws Exception {
        when(classRepository.findById(100)).thenReturn(Optional.of(classEntity));
        when(taskRepository.findById(999)).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/classes/100/tasks/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "curator", roles = "CURATOR")
    void shouldFailAssignIfClassNotFound() throws Exception {
        when(classRepository.findById(999)).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/classes/999/tasks/10"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "student", roles = "STUDENT")
    void shouldForbidStudentToAssignTask() throws Exception {
        mockMvc.perform(post("/api/classes/100/tasks/10"))
                .andExpect(status().isForbidden());

        verify(classRepository, never()).save(any());
    }

    @Test
    @WithMockUser(username = "otherCurator", roles = "CURATOR")
    void shouldFailToAssignClosedTaskOfAnotherUser() throws Exception {
        User otherCurator = new User();
        otherCurator.setId(3);
        otherCurator.setUsername("otherCurator");
        when(userRepository.findByUsername("otherCurator")).thenReturn(Optional.of(otherCurator));

        task.setIsOpen(false);

        when(classRepository.findById(100)).thenReturn(Optional.of(classEntity));
        when(taskRepository.findById(10)).thenReturn(Optional.of(task));

        mockMvc.perform(post("/api/classes/100/tasks/10"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorMessage").value("You can only assign your own tasks or open tasks"));
    }

    @Test
    @WithMockUser(username = "curator", roles = "CURATOR")
    void shouldRemoveTaskFromClass() throws Exception {
        classEntity.addTask(task);

        when(classRepository.findById(100)).thenReturn(Optional.of(classEntity));
        when(taskRepository.findById(10)).thenReturn(Optional.of(task));

        mockMvc.perform(delete("/api/classes/100/tasks/10"))
                .andExpect(status().isNoContent());

        assertEquals(0, classEntity.getTasks().size());
        verify(classRepository).save(classEntity);
    }
}