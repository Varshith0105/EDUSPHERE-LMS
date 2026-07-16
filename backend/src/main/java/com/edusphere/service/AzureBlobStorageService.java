package com.edusphere.service;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "storage.mode", havingValue = "azure")
public class AzureBlobStorageService implements UploadService {

    @Autowired(required = false)
    private BlobServiceClient blobServiceClient;

    @Value("${spring.cloud.azure.storage.blob.container-name:edusphere-media}")
    private String defaultContainerName;

    public String uploadFile(MultipartFile file) throws IOException {
        return uploadFile(defaultContainerName, file);
    }

    public String uploadFile(String containerName, MultipartFile file) throws IOException {
        if (blobServiceClient == null) {
            // Fallback for local runs where Azure client is not instantiated
            return "http://localhost:8080/files/" + file.getOriginalFilename();
        }

        BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
        if (!containerClient.exists()) {
            containerClient.create();
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String blobName = UUID.randomUUID().toString() + extension;

        BlobClient blobClient = containerClient.getBlobClient(blobName);
        blobClient.upload(file.getInputStream(), file.getSize(), true);

        return blobClient.getBlobUrl();
    }

    public void deleteFile(String blobUrl) {
        if (blobServiceClient == null || blobUrl == null) {
            return;
        }

        try {
            String containerPath = "/" + defaultContainerName + "/";
            if (blobUrl.contains(containerPath)) {
                String blobName = blobUrl.substring(blobUrl.indexOf(containerPath) + containerPath.length());
                BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(defaultContainerName);
                BlobClient blobClient = containerClient.getBlobClient(blobName);
                blobClient.deleteIfExists();
            }
        } catch (Exception e) {
            System.err.println("Failed to delete blob: " + e.getMessage());
        }
    }
}
