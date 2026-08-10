package com.saigontechnologyintern.document_management.authManagement;

import com.saigontechnologyintern.document_management.userManagement.UserManager;
import com.saigontechnologyintern.document_management.userManagement.UserManagerRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuthService {
    private final UserManagerRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            UserManagerRepository userRepository,
            JwtService jwtService,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponseDto register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }

        // CHANGED: password is now stored with BCrypt instead of plain text.
        UserManager user = new UserManager(
                request.getName(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                "User");
        userRepository.save(user);

        // CHANGED: generate a signed JWT instead of a local in-memory token.
        String token = jwtService.generateToken(user);
        return new AuthResponseDto(token, toUserManager(user));
    }

    public AuthResponseDto login(LoginRequest request) {
        UserManager user = userRepository
                .findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        // CHANGED: BCrypt password verification.
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        String token = jwtService.generateToken(user);
        return new AuthResponseDto(token, toUserManager(user));
    }

    public UserManager getCurrentUser(String token) {
        Integer userId = jwtService.extractUserId(token);
        UserManager user = userRepository
                .findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return toUserManager(user);
    }

    public void logout(String token) {
        // CHANGED: JWT is stateless, so logout is handled client-side until you add a token blacklist/refresh flow.
    }

    //dua ve DTO, mapper het'
    private UserManager toUserManager(UserManager user) {
        return new UserManager(
                user.getUserId() != null ? user.getUserId() : null,
                user.getName(),
                user.getEmail(),
                user.getRole() != null ? user.getRole().toUpperCase() : null,
                user.getCreatedAt() != null ? LocalDateTime.parse(user.getCreatedAt().toString()) : null);
    }
}
