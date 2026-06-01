package com.giproject.config;

import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${com.fullstack.upload.path}")
    private String uploadPath;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:3000",
                		"http://10.0.2.2:3000")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/g2i4/uploads/**")
                .addResourceLocations("classpath:/static/uploads/")
                .addResourceLocations("file:../uploads/")
                .setCacheControl(CacheControl.maxAge(30, TimeUnit.DAYS));

        // 저장 위치(com.fullstack.upload.path)와 동일한 경로에서 리뷰 이미지를 서빙 (OS 무관)
        String reviewLocation = Paths.get(uploadPath, "review").toUri().toString();
        if (!reviewLocation.endsWith("/")) {
            reviewLocation += "/";
        }

        registry.addResourceHandler("/review/**")
                .addResourceLocations(reviewLocation)
                .setCacheControl(CacheControl.maxAge(30, TimeUnit.DAYS));
    }
    
}
