package com.giproject.service.estimate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.giproject.dto.estimate.EstimateDTO;
import com.giproject.dto.fees.FeesBasicDTO;
import com.giproject.dto.fees.FeesExtraDTO;
import com.giproject.entity.estimate.Estimate;
import com.giproject.entity.fees.FeesBasic;
import com.giproject.entity.fees.FeesExtra;
import com.giproject.entity.cargo.CargoOwner;
import com.giproject.entity.matching.DirectRequest;
import com.giproject.entity.matching.Matching;
import com.giproject.entity.member.Member;
import com.giproject.repository.cargo.CargoOwnerRepository;
import com.giproject.repository.delivery.DeliveryRepository;
import com.giproject.repository.estimate.EsmateRepository;
import com.giproject.repository.fees.FeesBasicRepository;
import com.giproject.repository.fees.FeesExtraRepository;
import com.giproject.repository.matching.DirectRequestRepository;
import com.giproject.repository.matching.MatchingRepository;
import com.giproject.repository.payment.PaymentRepository;
import com.giproject.service.fees.FeesBasicService;
import com.giproject.service.fees.FeesExtraService;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@RequiredArgsConstructor
@Log4j2
public class EstimateServiceImpl implements EstimateService {
    private final EsmateRepository esmateRepository;
    private final MatchingRepository matchingRepository;
    private final FeesBasicRepository basicRepository;
    private final FeesBasicService basicService;
    private final FeesExtraRepository extraRepository;
    private final FeesExtraService extraService;
    private final PaymentRepository paymentRepository;
    private final DeliveryRepository deliveryRepository;
    private final CargoOwnerRepository cargoOwnerRepository;
    private final DirectRequestRepository directRequestRepository;

    /**
     * 요금 정책 조회 + 원가/할인/최종금액 계산을 DTO에 주입한다.
     * 공개모집(sendEstimate)과 직접요청(createDirectRequests)이 동일 로직을 공유.
     */
    private void applyFeeCalculation(EstimateDTO dto) {
        // 1. [어드민 정책 조회]
        FeesBasic feeConfig = basicRepository.findByWeight(dto.getCargoWeight())
                .orElseThrow(() -> new RuntimeException("해당 화물 무게에 대한 요금 정책이 없습니다."));

        // 2. [원가 계산]
        int baseCost = feeConfig.getInitialCharge().intValue(); // 기본료
        int distanceCost = (int) (dto.getDistanceKm() * feeConfig.getRatePerKm().intValue()); // 거리료

        // 🚨 [거리별 할인 시스템 가동] - 100/200/300/400 단위 할인 로직 호출
        int autoDiscount = calculateDistanceDiscount(dto.getDistanceKm(), baseCost + distanceCost);

        // 3. [금액 확정 및 DTO 주입]
        dto.setBaseCost(baseCost);
        dto.setDistanceCost(distanceCost);
        dto.setDistanceDiscount(autoDiscount); // 🚨 10원 단위 절사된 금액 저장

        // 최종 결제 금액 = (기본료 + 거리료 + 상하차/냉동옵션) - 거리할인 - 쿠폰할인
        int totalCost = (baseCost + distanceCost + dto.getSpecialOption()) - autoDiscount - dto.getCouponDiscount();
        dto.setTotalCost(Math.max(totalCost, 0)); // 마이너스 방지
        dto.setTemp(false);
    }

    @Override
    @Transactional
    public Long sendEstimate(EstimateDTO dto) {
    	log.info("견적서 제출 시작 - 회원: {}, 거리: {}km", dto.getMemberId(), dto.getDistanceKm());

            // 1~3. [요금 계산]
            applyFeeCalculation(dto);

            // 4. [DB 저장]
            Member member = esmateRepository.getMemId(dto.getMemberId())
                    .orElseThrow(() -> new RuntimeException("회원 정보가 없습니다."));

            Estimate estimate = DTOToEntity(dto, member);
            esmateRepository.save(estimate);

            // 5. [매칭 생성] - 공개모집. cargoOwner 미지정 → 전체 차주에게 노출
            Matching matching = Matching.builder()
                    .estimate(estimate)
                    .isAccepted(false)
                    .build();
            matchingRepository.save(matching);

            log.info("견적 확정! 최종금액: {}", dto.getTotalCost());

            return estimate.getEno();
        }

    @Override
    @Transactional
    public List<Long> createDirectRequests(EstimateDTO dto, List<String> cargoIds) {
        if (cargoIds == null || cargoIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "직접요청을 보낼 차주를 1명 이상 선택해야 합니다.");
        }
        long distinctCount = cargoIds.stream().distinct().count();
        if (distinctCount > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "직접요청은 한 번에 최대 5명의 차주에게만 보낼 수 있습니다.");
        }
        log.info("직접요청(팬아웃) 제출 - 화주: {}, 대상 차주 {}명, 거리: {}km",
                dto.getMemberId(), cargoIds.size(), dto.getDistanceKm());

        // 1. [요금 계산]
        applyFeeCalculation(dto);

        // 2. [견적 1개 신규 저장] - 차주들이 공유. OPEN 매칭은 만들지 않음(공개목록 비노출)
        Member member = esmateRepository.getMemId(dto.getMemberId())
                .orElseThrow(() -> new RuntimeException("회원 정보가 없습니다."));

        Estimate estimate = DTOToEntity(dto, member);
        esmateRepository.save(estimate);

        // 3. [차주 N명에게 DirectRequest 팬아웃 생성]
        List<Long> requestIds = new java.util.ArrayList<>();
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        for (String cargoId : cargoIds.stream().distinct().collect(Collectors.toList())) {
            CargoOwner owner = cargoOwnerRepository.findById(cargoId)
                    .orElseThrow(() -> new RuntimeException("요청 대상 차주를 찾을 수 없습니다: " + cargoId));

            DirectRequest request = DirectRequest.builder()
                    .estimate(estimate)
                    .cargoOwner(owner)
                    .requestedAt(now)
                    .build();
            directRequestRepository.save(request);
            requestIds.add(request.getId());
        }

        log.info("직접요청 생성 완료 - eno: {}, 생성된 요청 {}건", estimate.getEno(), requestIds.size());

        return requestIds;
    }

        @Override
        @Transactional
        public Long saveDraft(EstimateDTO estimateDTO) {
            Member member = esmateRepository.getMemId(estimateDTO.getMemberId())
                    .orElseThrow(() -> new RuntimeException("회원 정보가 없습니다."));
            
            int count = esmateRepository.estimateCount(member.getMemId());
            if(count >= 3) {
                throw new IllegalStateException("임시저장은 최대 3개까지 가능합니다.");
            }

            // 🚨 임시저장 시에도 사용자가 할인된 금액을 미리 볼 수 있도록 계산 반영
            basicRepository.findByWeight(estimateDTO.getCargoWeight()).ifPresent(config -> {
                int base = config.getInitialCharge().intValue();
                int dist = (int) (estimateDTO.getDistanceKm() * config.getRatePerKm().intValue());
                
                // 인터페이스의 할인 로직 적용
                int autoDisc = calculateDistanceDiscount(estimateDTO.getDistanceKm(), base + dist);
                
                estimateDTO.setBaseCost(base);
                estimateDTO.setDistanceCost(dist);
                estimateDTO.setDistanceDiscount(autoDisc);
                
                int total = (base + dist + estimateDTO.getSpecialOption()) - autoDisc - estimateDTO.getCouponDiscount();
                estimateDTO.setTotalCost(Math.max(total, 0));
            });

            estimateDTO.setTemp(true);
            Estimate estimate = DTOToEntity(estimateDTO, member);
            esmateRepository.save(estimate);
            return estimate.getEno();
        }

    // ... 아래 목록 조회(myEstimateList 등)는 기존 로직 그대로 유지 (entityToDTO에서 할인 필드 자동 매핑됨) ...

    @Override
    public List<EstimateDTO> getSaveEstimate(String memberId) {
        return esmateRepository.saveEstimateList(memberId).stream()
                .map(this::entityToDTO).collect(Collectors.toList());
    }

    @Override
    public EstimateDTO exportEstimate(String mameberId, Long eno) {
        Estimate estimate = esmateRepository.exportEs(mameberId, eno);
        return entityToDTO(estimate);
    }

    @Override
    public List<EstimateDTO> myEstimateList(String memberId) {
        List<Estimate> esList = esmateRepository.getMyEstimate(memberId);
        return esList.stream().map(estimate -> {
            EstimateDTO dto = entityToDTO(estimate);
            dto.setAccepted(matchingRepository.findIsAcceptedByEstimateNo(estimate.getEno()).orElse(false));
            dto.setMatchingNo(matchingRepository.findMatchingNoByEstimateNo(estimate.getEno()).orElse(null));
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    public List<FeesBasicDTO> searchFees() {
        return basicRepository.findAllAsc().stream()
                .map(basicService::entityToDTO).collect(Collectors.toList());
    }

    @Override
    public List<FeesExtraDTO> searchExtra() {
        // 🚨 여기서 findAll()을 했을 때 DB에 있는 '냉동식품' 등이 여전히 나오는지 로그를 찍어보세요.
        List<FeesExtra> list = extraRepository.findAll();
        log.info("조회된 추가요금 리스트 개수: {}", list.size()); 
        return list.stream()
                .map(extraService::entityToDTO).collect(Collectors.toList());
    }
    
    @Override
    public List<EstimateDTO> findMyEstimatesWithoutPayment(String memberId) {
        return esmateRepository.findMyEstimatesWithoutPayment(memberId).stream()
                .filter(e -> !e.isTemp()).map(e -> {
                    EstimateDTO dto = entityToDTO(e);
                    dto.setAccepted(matchingRepository.findIsAcceptedByEstimateNo(e.getEno()).orElse(false));
                    Long matchingNo = matchingRepository.findMatchingNoByEstimateNo(e.getEno()).orElse(null);
                    dto.setMatchingNo(matchingNo);
                    if (matchingNo != null) {
                        matchingRepository.findById(matchingNo).ifPresent(m -> {
                            if (m.getCargoOwner() != null) {
                                dto.setDriverName(m.getCargoOwner().getCargoName());
                                dto.setCargoId(m.getCargoOwner().getCargoId());
                            }
                        });
                    }
                    return dto;
                }).collect(Collectors.toList());
    }

    @Override
    public List<EstimateDTO> findMyPaidEstimates(String memberId) {
        return esmateRepository.findMyPaidEstimates(memberId).stream()
                .filter(e -> !e.isTemp()).map(e -> {
                    EstimateDTO dto = entityToDTO(e);
                    dto.setAccepted(matchingRepository.findIsAcceptedByEstimateNo(e.getEno()).orElse(false));
                    Long matchingNo = matchingRepository.findMatchingNoByEstimateNo(e.getEno()).orElse(null);
                    dto.setMatchingNo(matchingNo);
                    if (matchingNo != null) {
                        paymentRepository.findByOrderSheet_Matching_MatchingNo(matchingNo).ifPresent(p -> {
                            dto.setPaymentNo(p.getPaymentNo());
                            if (p.getOrderSheet() != null && p.getOrderSheet().getMatching() != null && p.getOrderSheet().getMatching().getCargoOwner() != null) {
                                dto.setDriverName(p.getOrderSheet().getMatching().getCargoOwner().getCargoName());
                                dto.setCargoId(p.getOrderSheet().getMatching().getCargoOwner().getCargoId());
                            }
                            deliveryRepository.findByPayment_PaymentNo(p.getPaymentNo()).ifPresent(d -> {
                                dto.setDeliveryStatus(d.getStatus());
                                dto.setDeliveryCompletedAt(d.getCompletTime());
                                dto.setDeliveryNo(d.getDeliveryNo());
                            });
                        });
                    }
                    return dto;
                }).toList();
    }
}