package com.giproject.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.security.servlet.PathRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.giproject.security.CustomOAuth2SuccessHandler;
import com.giproject.security.JwtAuthenticationFilter;
import com.giproject.security.JwtService;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final UserDetailsService userDetailsService;
    private final CustomOAuth2SuccessHandler customOAuth2SuccessHandler;

    public SecurityConfig(UserDetailsService userDetailsService,
                          CustomOAuth2SuccessHandler customOAuth2SuccessHandler) {
        this.userDetailsService = userDetailsService;
        this.customOAuth2SuccessHandler = customOAuth2SuccessHandler;
    }

    @Value("${frontend.base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    // CORS 허용 오리진 — application.properties 의 cors.allowed-origins 로 일원화 관리
    @Value("${cors.allowed-origins}")
    private List<String> allowedOrigins;

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter(JwtService jwtService,
                                                           UserDetailsService userDetailsService) {
        return new JwtAuthenticationFilter(jwtService, userDetailsService);
    }

    @Bean
    public AuthenticationProvider authenticationProvider(PasswordEncoder encoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(encoder);
        return provider;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           JwtAuthenticationFilter jwtAuthenticationFilter,
                                           AuthenticationProvider authenticationProvider) throws Exception {

        http
            .cors(c -> c.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .headers(h -> h.frameOptions(f -> f.sameOrigin()))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
            .formLogin(AbstractHttpConfigurer::disable)
            .requestCache(rc -> rc.disable())
            .exceptionHandling(e -> e
                .authenticationEntryPoint((req, res, ex) -> res.sendError(401))
                .accessDeniedHandler((req, res, ex) -> res.sendError(403))
            )
            .oauth2Login(o -> o
                .authorizationEndpoint(a -> a.baseUri("/oauth2/authorization"))
                .redirectionEndpoint(r -> r.baseUri("/login/oauth2/code/*"))
                .successHandler(customOAuth2SuccessHandler)
                .failureHandler((req, res, ex) -> {
                    // 🔒 [보안 수정] Origin 헤더(공격자 조작 가능) 대신 신뢰된 frontend.base-url 로 고정 → 오픈 리다이렉트 차단
                    String msg = ex.getMessage() == null ? "oauth2_failed" : ex.getMessage();
                    String target = frontendBaseUrl + "/login?error=" +
                        java.net.URLEncoder.encode(msg, java.nio.charset.StandardCharsets.UTF_8);
                    res.sendRedirect(target);
                })
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                .requestMatchers("/", "/index.html", "/error", "/favicon.ico",
                                 "/assets/**", "/static/**").permitAll()
                .requestMatchers(PathRequest.toStaticResources().atCommonLocations()).permitAll()

                .requestMatchers("/oauth2/**", "/login/**").permitAll()

                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/email/**").permitAll()

                .requestMatchers("/uploads/**", "/review/**", "/h2-console/**").permitAll()

                // 🔒 [보안 수정] 관리자 API 는 ROLE_ADMIN 권한 필수 (기존 permitAll → 인가 우회 취약점 제거)
                .requestMatchers("/fr/admin/**").hasAuthority("ROLE_ADMIN")

                // 🔒 [보안 수정] 로그인 필요 영역 — 인증된 사용자만 (결제/마이페이지/회원/사용자/차주)
                .requestMatchers("/fr/payment/**","/fr/mypage/**","/fr/user/**",
                                 "/fr/member/**","/fr/owner/**","/fr/subpath/order/**").authenticated()

                .requestMatchers("/fr/estimate/list").hasAnyAuthority("ROLE_DRIVER","ROLE_SHIPPER")

                // 공개 영역(이미지/공개 조회 등) — 기능 호환을 위해 유지. ⚠️ 후속으로 개별 인가 점검 권장
                .requestMatchers("/fr/uploads/**","/g2i4/uploads/**","/fr/address/**","/fr/cargo/**",
                                 "/fr/main/**","/fr/estimate/subpath/**","/fr/delivery/**",
                                 "/fr/qna/**","/fr/coupons/**","/fr/maps/**").permitAll()
                // 🔒 [보안] 채팅 API 는 인증 필요 — GET /api/chat/history 가 전체 메시지를 노출하던 문제 차단
                .requestMatchers("/api/chat/**").authenticated()
                .requestMatchers("/api/**").permitAll() // ⚠️ 후속: 나머지 /api/** 도 엔드포인트별 인가 점검 필요

                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider)
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * 프로젝트 전체 CORS 단일 진입점.
     * (기존 CorsConfig.corsFilter / WebConfig.addCorsMappings 중복 제거 → 이 빈으로 일원화)
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}