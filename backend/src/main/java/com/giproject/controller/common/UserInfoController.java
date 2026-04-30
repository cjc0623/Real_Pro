package com.giproject.controller.common;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.giproject.entity.cargo.CargoOwner;
import com.giproject.entity.member.Member;
import com.giproject.repository.cargo.CargoOwnerRepository;
import com.giproject.repository.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/g2i4/user")
@RequiredArgsConstructor
public class UserInfoController {

    private final MemberRepository memberRepository;
    private final CargoOwnerRepository cargoOwnerRepository;
    private final Cloudinary cloudinary;

    @GetMapping("/info")
    public ResponseEntity<?> getUserInfo(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "UNAUTHORIZED"));
        }
        final String userId = auth.getName();

        Member m = memberRepository.findById(userId).orElse(null);
        if (m != null) {
            String imageUrl = m.getProfileImage();

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("mem_id", m.getMemId());
            data.put("mem_name", m.getMemName());
            data.put("mem_email", m.getMemEmail());
            data.put("mem_phone", m.getMemPhone());
            data.put("mem_address", m.getMemAddress());
            data.put("mem_create_id_date_time", m.getMemCreateIdDateTime());
            data.put("profileImage", imageUrl);
            data.put("webPath", imageUrl);

            boolean isAdmin = m.getMemberRoleList().contains("ADMIN");

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("userType", isAdmin ? "ADMIN" : "MEMBER");
            body.put("data", data);
            return ResponseEntity.ok(body);
        }

        CargoOwner c = cargoOwnerRepository.findById(userId).orElse(null);
        if (c != null) {
            String imageUrl = c.getProfileImage();

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("cargo_id", c.getCargoId());
            data.put("cargo_name", c.getCargoName());
            data.put("cargo_email", c.getCargoEmail());
            data.put("cargo_phone", c.getCargoPhone());
            data.put("cargo_address", c.getCargoAddress());
            data.put("cargo_created_datetime", c.getCargoCreatedDateTime());
            data.put("profileImage", imageUrl);
            data.put("webPath", imageUrl);

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("userType", "CARGO_OWNER");
            body.put("data", data);
            return ResponseEntity.ok(body);
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "NOT_FOUND"));
    }

    @PostMapping("/upload-image")
    public ResponseEntity<?> uploadProfileImage(
            @RequestParam("image") MultipartFile file,
            @RequestParam("userType") String userType,
            @RequestParam("id") String id) {

        if (file.isEmpty()) return ResponseEntity.badRequest().body("파일이 없습니다.");

        try {
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
            String imageUrl = (String) uploadResult.get("secure_url");

            if ("MEMBER".equalsIgnoreCase(userType)) {
                Member m = memberRepository.findById(id).orElseThrow();
                m.setProfileImage(imageUrl);
                memberRepository.save(m);
            } else if ("CARGO_OWNER".equalsIgnoreCase(userType)) {
                CargoOwner c = cargoOwnerRepository.findById(id).orElseThrow();
                c.setProfileImage(imageUrl);
                cargoOwnerRepository.save(c);
            } else {
                return ResponseEntity.badRequest().body("userType이 잘못되었습니다.");
            }

            return ResponseEntity.ok(Map.of("webPath", imageUrl));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("업로드 실패: " + e.getMessage());
        }
    }

    @DeleteMapping("/profile-image")
    public ResponseEntity<?> deleteProfileImage(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "UNAUTHORIZED"));
        }

        final String userId = auth.getName();
        String imageUrl = null;

        Member m = memberRepository.findById(userId).orElse(null);
        if (m != null) {
            imageUrl = m.getProfileImage();
            m.setProfileImage(null);
            memberRepository.save(m);
        } else {
            CargoOwner c = cargoOwnerRepository.findById(userId).orElse(null);
            if (c != null) {
                imageUrl = c.getProfileImage();
                c.setProfileImage(null);
                cargoOwnerRepository.save(c);
            }
        }

        if (imageUrl != null && !imageUrl.isBlank()) {
            try {
                String publicId = imageUrl
                    .substring(imageUrl.lastIndexOf("/") + 1)
                    .replaceAll("\\.[^.]+$", "");
                cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            } catch (Exception ignore) {}
        }

        return ResponseEntity.ok(Map.of("removed", true));
    }
}
