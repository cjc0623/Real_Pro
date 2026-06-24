package com.giproject.service.payment;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.Map;

/**
 * PortOne V2 서버측 결제 검증.
 * 클라이언트가 보낸 paymentId 로 PortOne 서버에 실제 결제 내역을 조회해
 * (1) 상태가 PAID 인지, (2) 결제 금액이 서버가 산출한 finalPrice 와 일치하는지 검증한다.
 *
 * portone.api-secret 미설정 시(개발/데모) 검증을 건너뛰고 경고 로그만 남긴다.
 * ⚠️ 운영에서는 반드시 portone.api-secret 을 설정해야 결제 위변조를 막을 수 있다.
 */
@Slf4j
@Service
public class PortOneVerificationService {

    @Value("${portone.api-secret:}")
    private String apiSecret;

    private final RestTemplate restTemplate = new RestTemplate();

    public void verify(String paymentId, long expectedAmount) {
        if (apiSecret == null || apiSecret.isBlank()) {
            log.warn("[PortOne] api-secret 미설정 — 결제 서버검증 건너뜀(paymentId={}). 운영 환경에서는 반드시 설정하세요.", paymentId);
            return;
        }
        if (paymentId == null || paymentId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "paymentId 가 없습니다.");
        }

        try {
            String url = "https://api.portone.io/payments/" + paymentId;
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "PortOne " + apiSecret);
            ResponseEntity<Map> res = restTemplate.exchange(url, org.springframework.http.HttpMethod.GET,
                    new HttpEntity<>(headers), Map.class);

            Map body = res.getBody();
            if (body == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "PortOne 응답이 비어있습니다.");
            }
            String status = String.valueOf(body.get("status"));
            if (!"PAID".equals(status)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결제가 완료되지 않았습니다(status=" + status + ").");
            }
            Object amountObj = body.get("amount");
            long paidTotal = -1;
            if (amountObj instanceof Map<?, ?> amountMap) {
                Object total = amountMap.get("total");
                if (total instanceof Number n) paidTotal = n.longValue();
            }
            if (paidTotal != expectedAmount) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "결제 금액이 일치하지 않습니다(서버=" + expectedAmount + ", 실제=" + paidTotal + ").");
            }
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("[PortOne] 결제 검증 실패(paymentId={}): {}", paymentId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "결제 검증 중 오류가 발생했습니다.");
        }
    }
}
