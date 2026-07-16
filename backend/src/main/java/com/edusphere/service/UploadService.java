package com.edusphere.service;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

public interface UploadService {
    String uploadFile(MultipartFile file) throws IOException;
    String uploadFile(String containerName, MultipartFile file) throws IOException;
    void deleteFile(String fileUrl);
}
