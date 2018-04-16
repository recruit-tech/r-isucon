package jp.co.recruit.riscon.config;

import java.io.IOException;

import javax.servlet.MultipartConfigElement;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.servlet.MultipartConfigFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ResourceLoader;

@Configuration
public class MultiPartConfigure {
    @Autowired
    ResourceLoader resourceLoader;

    @Bean
    public MultipartConfigElement multipartConfigElement() throws IOException {
        MultipartConfigFactory factory = new MultipartConfigFactory();
        String path = System.getenv("IMAGE_UPLOAD_PATH");
        factory.setLocation(path);
        factory.setMaxFileSize("100MB");
        factory.setMaxRequestSize("100MB");
        return factory.createMultipartConfig();
    }
}
