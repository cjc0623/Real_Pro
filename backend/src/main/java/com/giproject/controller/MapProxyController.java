package com.giproject.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

/**
 * Kakao 지도/길찾기 REST API 프록시.
 * 🔒 [보안] Kakao REST API 키(KakaoAK)를 브라우저에 노출하지 않기 위해 서버에서 대리 호출한다.
 * 프론트는 키 없이 /fr/maps/** 를 호출하고, 서버가 서버측 키로 Kakao 에 요청한다.
 * 응답은 Kakao 원본 JSON 을 그대로 전달하여 프론트 파싱 로직을 변경하지 않는다.
 */
@Slf4j
@RestController
@RequestMapping("/fr/maps")
public class MapProxyController {

    @Value("${kakao.rest-api-key:}")
    private String kakaoRestApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    private HttpEntity<Void> authEntity() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "KakaoAK " + kakaoRestApiKey);
        headers.setAccept(java.util.List.of(MediaType.APPLICATION_JSON));
        return new HttpEntity<>(headers);
    }

    /**
     * 이미 인코딩된 URI 를 전달해 RestTemplate 의 이중 인코딩을 방지하고,
     * Kakao 4xx/5xx 응답은 상태·본문 그대로 전달, 그 외 오류는 502 로 변환한다.
     */
    private ResponseEntity<String> proxyGet(URI uri) {
        try {
            ResponseEntity<String> resp = restTemplate.exchange(uri, HttpMethod.GET, authEntity(), String.class);
            // ⚠️ 업스트림(Kakao) 응답 헤더를 그대로 전달하면 Kakao 의 Access-Control-Allow-Origin: *
            //    가 우리 CORS 필터가 넣는 값과 충돌해 브라우저가 "multiple values" 로 차단한다.
            //    → 본문과 Content-Type 만 전달하고 업스트림 헤더는 버린다.
            return ResponseEntity.status(resp.getStatusCode())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(resp.getBody());
        } catch (HttpStatusCodeException e) {
            log.warn("[MapProxy] Kakao 응답 오류 {} : {}", e.getStatusCode(), e.getResponseBodyAsString());
            return ResponseEntity.status(e.getStatusCode())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("[MapProxy] 호출 실패: {}", e.getMessage());
            return ResponseEntity.status(502)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"map proxy failed\"}");
        }
    }

    /** 주소 → 좌표 (Kakao Local) */
    @GetMapping("/geocode")
    public ResponseEntity<String> geocode(@RequestParam("query") String query) {
        URI uri = UriComponentsBuilder
                .fromHttpUrl("https://dapi.kakao.com/v2/local/search/address.json")
                .queryParam("query", query)
                .encode()          // 한 번만 인코딩
                .build()
                .toUri();          // URI 로 전달 → RestTemplate 재인코딩 방지
        return proxyGet(uri);
    }

    /** 좌표 경로 거리 (Kakao Mobility Directions) */
    @GetMapping("/directions")
    public ResponseEntity<String> directions(@RequestParam("origin") String origin,
                                             @RequestParam("destination") String destination) {
        URI uri = UriComponentsBuilder
                .fromHttpUrl("https://apis-navi.kakaomobility.com/v1/directions")
                .queryParam("origin", origin)
                .queryParam("destination", destination)
                .encode()
                .build()
                .toUri();
        return proxyGet(uri);
    }
}
