package com.giproject.controller;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.giproject.dto.cargo.CargoDTO;
import com.giproject.entity.cargo.Cargo;
import com.giproject.entity.cargo.CargoOwner;
import com.giproject.repository.cargo.CargoOwnerRepository;
import com.giproject.repository.cargo.CargoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Slf4j
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RestController
@RequestMapping("/g2i4/cargo")
@RequiredArgsConstructor
public class CargoController {

    private final CargoRepository cargoRepository;
    private final CargoOwnerRepository cargoOwnerRepository;

    @Value("${cloudinary.cloud-name}")
    private String cloudName;

    @Value("${cloudinary.api-key}")
    private String apiKey;

    @Value("${cloudinary.api-secret}")
    private String apiSecret;

    private String uploadToCloudinary(MultipartFile file) throws Exception {
        Cloudinary cloudinary = new Cloudinary(ObjectUtils.asMap(
            "cloud_name", cloudName,
            "api_key", apiKey,
            "api_secret", apiSecret
        ));
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
        return (String) uploadResult.get("secure_url");
    }

    @GetMapping("/list/{cargoId}")
    public ResponseEntity<List<Cargo>> getCargoList(@PathVariable("cargoId") String cargoId) {
        List<Cargo> list = cargoRepository.findByCargoOwner_CargoId(cargoId);
        return ResponseEntity.ok(list);
    }

    @PostMapping("/add/{cargoId}")
    @Transactional
    public ResponseEntity<?> registerCargo(
            @PathVariable("cargoId") String cargoId,
            @RequestPart("dto") CargoDTO dto,
            @RequestPart("image") MultipartFile file
    ) {
        try {
            if (file == null || file.isEmpty())
                return ResponseEntity.badRequest().body("차량 사진 등록은 필수입니다.");
            if (dto.getName() == null || dto.getName().isBlank() ||
                dto.getAddress() == null || dto.getAddress().isBlank() ||
                dto.getWeight() == null || dto.getWeight().isBlank() ||
                dto.getCargoNumber() == null || dto.getCargoNumber().isBlank()) {
                return ResponseEntity.badRequest().body("모든 차량 정보를 입력해야 합니다.");
            }

            CargoOwner owner = cargoOwnerRepository.findById(cargoId)
                    .orElseThrow(() -> new RuntimeException("소유자 없음"));

            // ✅ Cloudinary 업로드만 수행
            String webPath = uploadToCloudinary(file);

            Cargo cargo = new Cargo();
            cargo.setCargoName(dto.getName());
            cargo.setCargoType(dto.getAddress());
            cargo.setCargoCapacity(dto.getWeight());
            cargo.setCargoNumber(dto.getCargoNumber());
            cargo.setCargoImage(webPath);
            cargo.setStatus("PENDING");
            cargo.setCargoOwner(owner);

            Cargo saved = cargoRepository.save(cargo);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            log.error("등록 에러: ", e);
            return ResponseEntity.status(400).body("등록 실패: " + e.getMessage());
        }
    }

    @PutMapping("/update/{cargoNo}")
    @Transactional
    public ResponseEntity<?> updateCargo(
            @PathVariable("cargoNo") Integer cargoNo,
            @RequestBody CargoDTO dto) {
        try {
            Cargo cargo = cargoRepository.findById(cargoNo)
                    .orElseThrow(() -> new IllegalArgumentException("차량 없음: " + cargoNo));

            cargo.setCargoName(dto.getName());
            cargo.setCargoType(dto.getAddress());
            cargo.setCargoCapacity(dto.getWeight());
            cargo.setCargoNumber(dto.getCargoNumber());
            cargo.setStatus("PENDING");

            return ResponseEntity.ok(cargoRepository.save(cargo));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("수정 실패: " + e.getMessage());
        }
    }

    @DeleteMapping("/delete/{cargoNo}")
    public ResponseEntity<?> deleteCargo(@PathVariable("cargoNo") Integer cargoNo) {
        try {
            cargoRepository.deleteById(cargoNo);
            return ResponseEntity.ok("삭제 성공");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("삭제 실패: " + e.getMessage());
        }
    }

    // ✅ 이미지 단독 교체도 Cloudinary로 변경
    @PostMapping("/upload/{cargoNo}")
    public ResponseEntity<?> uploadImage(
            @PathVariable("cargoNo") Integer cargoNo,
            @RequestParam("image") MultipartFile file) {
        try {
            Cargo cargo = cargoRepository.findById(cargoNo)
                    .orElseThrow(() -> new RuntimeException("차량 없음: " + cargoNo));

            if (file.isEmpty())
                return ResponseEntity.badRequest().body("파일이 없습니다.");

            String webPath = uploadToCloudinary(file);
            cargo.setCargoImage(webPath);
            cargoRepository.save(cargo);

            Map<String, Object> res = new HashMap<>();
            res.put("webPath", webPath);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("업로드 실패: " + e.getMessage());
        }
    }

    @GetMapping("/all/approved")
    public ResponseEntity<List<Cargo>> getAllApprovedCargo() {
        List<Cargo> approvedList = cargoRepository.findAll();
        return ResponseEntity.ok(approvedList);
    }
}
