package com.edusphere.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "storage.mode", havingValue = "local", matchIfMissing = true)
public class LocalUploadService implements UploadService {

    private final String uploadDir = "uploads";

    @Override
    public String uploadFile(MultipartFile file) throws IOException {
        return uploadFile("default", file);
    }

    @Override
    public String uploadFile(String containerName, MultipartFile file) throws IOException {
        Path copyLocation = Paths.get(uploadDir + File.separator + containerName);
        if (!Files.exists(copyLocation)) {
            Files.createDirectories(copyLocation);
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String fileName = UUID.randomUUID().toString() + extension;

        Files.copy(file.getInputStream(), copyLocation.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);

        // Return URL prefix mapped by WebConfig
        return "/api/files/" + containerName + "/" + fileName;
    }

    @Override
    public void deleteFile(String fileUrl) {
        if (fileUrl == null || !fileUrl.contains("/api/files/")) {
            return;
        }
        try {
            String relativePath = fileUrl.substring(fileUrl.indexOf("/api/files/") + "/api/files/".length());
            Path filePath = Paths.get(uploadDir).resolve(relativePath);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            System.err.println("Failed to delete local file: " + e.getMessage());
        }
    }
}
