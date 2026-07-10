-- --------------------------------------------------------
-- 호스트:                          127.0.0.1
-- 서버 버전:                        12.2.2-MariaDB - MariaDB Server
-- 서버 OS:                        Win64
-- HeidiSQL 버전:                  12.14.0.7165
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- bootex 데이터베이스 구조 내보내기
CREATE DATABASE IF NOT EXISTS `bootex` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */;
USE `bootex`;

-- 테이블 bootex.admin_response 구조 내보내기
CREATE TABLE IF NOT EXISTS `admin_response` (
  `response_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `admin_id` varchar(50) NOT NULL,
  `admin_name` varchar(100) NOT NULL,
  `content` text NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `post_id` bigint(20) NOT NULL,
  PRIMARY KEY (`response_id`),
  UNIQUE KEY `UKoeak2ch98pelyl9f95r4chpnc` (`post_id`),
  CONSTRAINT `FKmmuu65w4l2ugd177kgxkm5y9q` FOREIGN KEY (`post_id`) REFERENCES `qa_post` (`post_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 테이블 데이터 bootex.admin_response:~0 rows (대략적) 내보내기
DELETE FROM `admin_response`;

-- 테이블 bootex.cargo 구조 내보내기
CREATE TABLE IF NOT EXISTS `cargo` (
  `cargo_no` int(11) NOT NULL AUTO_INCREMENT,
  `cargo_capacity` varchar(255) DEFAULT NULL,
  `cargo_created_datetime` datetime(6) DEFAULT NULL,
  `cargo_image` varchar(255) DEFAULT NULL,
  `cargo_name` varchar(255) DEFAULT NULL,
  `cargo_number` varchar(255) NOT NULL,
  `cargo_type` varchar(255) DEFAULT NULL,
  `cargo_status` varchar(255) DEFAULT NULL,
  `cargo_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`cargo_no`),
  KEY `FK2cbaqkvjl9tgunaiwqhdpd0h1` (`cargo_id`),
  CONSTRAINT `FK2cbaqkvjl9tgunaiwqhdpd0h1` FOREIGN KEY (`cargo_id`) REFERENCES `cargo_owner` (`cargo_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 테이블 데이터 bootex.cargo:~2 rows (대략적) 내보내기
DELETE FROM `cargo`;
INSERT INTO `cargo` (`cargo_no`, `cargo_capacity`, `cargo_created_datetime`, `cargo_image`, `cargo_name`, `cargo_number`, `cargo_type`, `cargo_status`, `cargo_id`) VALUES
	(5, '1톤', '2026-06-18 10:52:30.140187', '/fr/uploads/cargo/2466676c-4348-4d8e-8990-fffb2e35f79f.jpeg', 'a', '11가1111', '1톤', 'APPROVED', 'test2'),
	(6, '5톤 이상', '2026-06-18 10:52:58.739792', '/fr/uploads/cargo/8f07ced9-ecee-4584-b1cc-37ece54324c7.jpeg', 'b', '11나1111', '5톤 이상', 'APPROVED', 'test1234');

-- 테이블 bootex.cargo_owner 구조 내보내기
CREATE TABLE IF NOT EXISTS `cargo_owner` (
  `cargo_id` varchar(50) NOT NULL,
  `cargo_address` varchar(255) DEFAULT NULL,
  `cargo_created_date_time` datetime(6) NOT NULL,
  `cargo_email` varchar(120) NOT NULL,
  `cargo_name` varchar(60) NOT NULL,
  `cargo_phone` varchar(30) DEFAULT NULL,
  `cargo_pw` varchar(200) NOT NULL,
  `is_verified` bit(1) NOT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `social` bit(1) NOT NULL,
  `verified_at` datetime(6) DEFAULT NULL,
  `verified_phone` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`cargo_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 테이블 데이터 bootex.cargo_owner:~2 rows (대략적) 내보내기
DELETE FROM `cargo_owner`;
INSERT INTO `cargo_owner` (`cargo_id`, `cargo_address`, `cargo_created_date_time`, `cargo_email`, `cargo_name`, `cargo_phone`, `cargo_pw`, `is_verified`, `profile_image`, `social`, `verified_at`, `verified_phone`) VALUES
	('test1234', '강원특별자치도 춘천시 한림대학길 1 공학관', '2026-05-11 14:51:43.666920', 'gktmdwns1037@gmail.com', 'gktmdwns', '01012341234', '$2a$10$5IYE33Xy1B0uH5pbXzgBQ.lBWq4Pufy8U5Lv/TBAhoqITguW8VP1q', b'0', NULL, b'0', NULL, NULL),
	('test2', '서울시 테스트구', '2026-05-11 14:45:24.882450', 'test2@test.com', '테스트차주', '010-2222-2222', '$2a$10$6WodA5k0ilSnmQZG1BK6JeqwgP0hHoI0CNxgng7xorA5/PJmwY4bq', b'0', NULL, b'0', NULL, NULL);

-- 테이블 bootex.chat_message 구조 내보내기
CREATE TABLE IF NOT EXISTS `chat_message` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `message` varchar(255) DEFAULT NULL,
  `send_time` datetime(6) DEFAULT NULL,
  `sender_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 테이블 데이터 bootex.chat_message:~0 rows (대략적) 내보내기
DELETE FROM `chat_message`;

-- 테이블 bootex.coupon 구조 내보내기
CREATE TABLE IF NOT EXISTS `coupon` (
  `cno` bigint(20) NOT NULL AUTO_INCREMENT,
  `coupon_name` varchar(255) DEFAULT NULL,
  `discount_value` int(11) NOT NULL,
  `max_discount` int(11) NOT NULL,
  `min_order_price` int(11) NOT NULL,
  `valid_days` int(11) NOT NULL,
  PRIMARY KEY (`cno`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 테이블 데이터 bootex.coupon:~3 rows (대략적) 내보내기
DELETE FROM `coupon`;
INSERT INTO `coupon` (`cno`, `coupon_name`, `discount_value`, `max_discount`, `min_order_price`, `valid_days`) VALUES
	(1, '오픈기념 10% 할인쿠폰', 10, 10000, 0, 30),
	(2, '단골우대 20% 할인쿠폰', 20, 20000, 0, 30),
	(3, 'VIP전용 30% 특별할인쿠폰', 30, 30000, 0, 30);

-- 테이블 bootex.delivery 구조 내보내기
CREATE TABLE IF NOT EXISTS `delivery` (
  `delivery_no` bigint(20) NOT NULL AUTO_INCREMENT,
  `complet_time` datetime(6) DEFAULT NULL,
  `status` enum('COMPLETED','IN_TRANSIT','PENDING') NOT NULL,
  `cargo_owner_id` varchar(50) DEFAULT NULL,
  `payment_no` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`delivery_no`),
  UNIQUE KEY `UKcel31rg554q4ag013xe0072ys` (`payment_no`),
  KEY `FK1vvyh24olaiyp1lr3xoa3ke0t` (`cargo_owner_id`),
  CONSTRAINT `FK1vvyh24olaiyp1lr3xoa3ke0t` FOREIGN KEY (`cargo_owner_id`) REFERENCES `cargo_owner` (`cargo_id`),
  CONSTRAINT `FKac517u8u3wn0ldj9qjv4alsk` FOREIGN KEY (`payment_no`) REFERENCES `payment` (`payment_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 테이블 데이터 bootex.delivery:~0 rows (대략적) 내보내기
DELETE FROM `delivery`;

-- 테이블 bootex.direct_request 구조 내보내기
CREATE TABLE IF NOT EXISTS `direct_request` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `requested_at` datetime(6) DEFAULT NULL,
  `responded_at` datetime(6) DEFAULT NULL,
  `status` enum('ACCEPTED','CANCELED','REJECTED','REQUESTED') DEFAULT NULL,
  `cargo_id` varchar(50) DEFAULT NULL,
  `eno` bigint(20) DEFAULT NULL,
  `matching_no` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_direct_request_estimate_cargo` (`eno`,`cargo_id`),
  KEY `FKk3his2sv363phct1lh2ij7gw2` (`cargo_id`),
  KEY `FKqot9gv3srhxbxpmex7m9ee33y` (`matching_no`),
  CONSTRAINT `FKa8csii97kkv1s19j4ufwf7qwq` FOREIGN KEY (`eno`) REFERENCES `estimate` (`eno`),
  CONSTRAINT `FKk3his2sv363phct1lh2ij7gw2` FOREIGN KEY (`cargo_id`) REFERENCES `cargo_owner` (`cargo_id`),
  CONSTRAINT `FKqot9gv3srhxbxpmex7m9ee33y` FOREIGN KEY (`matching_no`) REFERENCES `matching` (`matching_no`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 테이블 데이터 bootex.direct_request:~2 rows (대략적) 내보내기
DELETE FROM `direct_request`;
INSERT INTO `direct_request` (`id`, `requested_at`, `responded_at`, `status`, `cargo_id`, `eno`, `matching_no`) VALUES
	(1, '2026-06-18 10:54:15.566374', '2026-06-18 10:54:34.205660', 'CANCELED', 'test1234', 3, NULL),
	(2, '2026-06-18 10:54:15.566374', '2026-06-18 10:54:34.205660', 'ACCEPTED', 'test2', 3, 3);

-- 테이블 bootex.estimate 구조 내보내기
CREATE TABLE IF NOT EXISTS `estimate` (
  `eno` bigint(20) NOT NULL AUTO_INCREMENT,
  `base_cost` int(11) NOT NULL,
  `cargo_type` varchar(255) DEFAULT NULL,
  `cargo_weight` varchar(255) DEFAULT NULL,
  `coupon_discount` int(11) NOT NULL,
  `coupon_no` bigint(20) DEFAULT NULL,
  `distance_cost` int(11) NOT NULL,
  `distance_discount` int(11) NOT NULL,
  `distance_km` double NOT NULL,
  `end_address` varchar(255) DEFAULT NULL,
  `end_lat` double DEFAULT NULL,
  `end_lng` double DEFAULT NULL,
  `is_ordered` bit(1) NOT NULL,
  `is_temp` bit(1) NOT NULL,
  `matched` bit(1) NOT NULL,
  `special_option` int(11) NOT NULL,
  `start_address` varchar(255) DEFAULT NULL,
  `start_lat` double DEFAULT NULL,
  `start_lng` double DEFAULT NULL,
  `start_time` datetime(6) DEFAULT NULL,
  `total_cost` int(11) NOT NULL,
  `mem_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`eno`),
  KEY `FK4r6kn1r4t3k9mcsf3o6ufg2ld` (`mem_id`),
  CONSTRAINT `FK4r6kn1r4t3k9mcsf3o6ufg2ld` FOREIGN KEY (`mem_id`) REFERENCES `member` (`mem_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 테이블 데이터 bootex.estimate:~3 rows (대략적) 내보내기
DELETE FROM `estimate`;
INSERT INTO `estimate` (`eno`, `base_cost`, `cargo_type`, `cargo_weight`, `coupon_discount`, `coupon_no`, `distance_cost`, `distance_discount`, `distance_km`, `end_address`, `end_lat`, `end_lng`, `is_ordered`, `is_temp`, `matched`, `special_option`, `start_address`, `start_lat`, `start_lng`, `start_time`, `total_cost`, `mem_id`) VALUES
	(1, 25000, '유류', '0.5톤', 0, NULL, 7440, 0, 9.3, '서울 중구 필동2가 128-15', NULL, NULL, b'0', b'0', b'1', 50000, '서울 서대문구 홍제동 산 1-1', NULL, NULL, '2026-05-12 09:00:00.000000', 82440, 'test1'),
	(2, 110000, '유류', '3톤', 0, NULL, 21600, 0, 12, '서울 중구 장충동2가 산 14-67', NULL, NULL, b'0', b'0', b'1', 50000, '서울 서대문구 연희동 산 1', NULL, NULL, '2026-05-12 09:00:00.000000', 181600, 'test1'),
	(3, 45000, '유류', '1톤', 0, NULL, 9500, 0, 9.5, '서울 성동구 금호동2가 1-2', NULL, NULL, b'0', b'0', b'1', 0, '서울 종로구 옥인동 산 3-14', NULL, NULL, '2026-06-19 09:00:00.000000', 54500, 'test1');

-- 테이블 bootex.fees_basic 구조 내보내기
CREATE TABLE IF NOT EXISTS `fees_basic` (
  `tno` bigint(20) NOT NULL AUTO_INCREMENT,
  `cargo_image` varchar(255) DEFAULT NULL,
  `cargo_name` varchar(50) DEFAULT NULL,
  `initial_charge` decimal(12,2) DEFAULT NULL,
  `rate_per_km` decimal(12,2) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `weight` varchar(50) NOT NULL,
  PRIMARY KEY (`tno`),
  UNIQUE KEY `UK1ay2l80kx9klm2j1dqyk7tq11` (`weight`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 테이블 데이터 bootex.fees_basic:~7 rows (대략적) 내보내기
DELETE FROM `fees_basic`;
INSERT INTO `fees_basic` (`tno`, `cargo_image`, `cargo_name`, `initial_charge`, `rate_per_km`, `updated_at`, `weight`) VALUES
	(1, NULL, '0.5톤 차량', 25000.00, 800.00, '2026-05-11 14:45:24.888454', '0.5톤'),
	(2, NULL, '1톤 차량', 45000.00, 1000.00, '2026-05-11 14:45:24.891463', '1톤'),
	(3, NULL, '2톤 차량', 80000.00, 1400.00, '2026-05-11 14:45:24.893456', '2톤'),
	(4, NULL, '3톤 차량', 110000.00, 1800.00, '2026-05-11 14:45:24.896462', '3톤'),
	(5, NULL, '4톤 차량', 150000.00, 2200.00, '2026-05-11 14:45:24.898454', '4톤'),
	(6, NULL, '5톤 차량', 200000.00, 2800.00, '2026-05-11 14:45:24.900454', '5톤'),
	(7, NULL, '5톤 초과(대형)', 300000.00, 3500.00, '2026-05-11 14:45:24.903454', '5톤 이상');

-- 테이블 bootex.fees_extra 구조 내보내기
CREATE TABLE IF NOT EXISTS `fees_extra` (
  `exno` bigint(20) NOT NULL AUTO_INCREMENT,
  `extra_charge` decimal(12,2) DEFAULT NULL,
  `extra_charge_title` varchar(50) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`exno`),
  UNIQUE KEY `UKihxfsj52ei24ahxhyggy1agdl` (`extra_charge_title`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 테이블 데이터 bootex.fees_extra:~2 rows (대략적) 내보내기
DELETE FROM `fees_extra`;
INSERT INTO `fees_extra` (`exno`, `extra_charge`, `extra_charge_title`, `updated_at`) VALUES
	(1, 50000.00, '상하차 도움', '2026-05-11 14:45:24.907079'),
	(2, 85000.00, '상하차 + 인부 1명', '2026-05-11 14:45:24.910092');

-- 테이블 bootex.matching 구조 내보내기
CREATE TABLE IF NOT EXISTS `matching` (
  `matching_no` bigint(20) NOT NULL AUTO_INCREMENT,
  `accepted_time` datetime(6) DEFAULT NULL,
  `is_accepted` bit(1) NOT NULL,
  `cargo_id` varchar(50) DEFAULT NULL,
  `eno` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`matching_no`),
  KEY `FKccqw0ag7vh1fbwgdgjj63tf27` (`cargo_id`),
  KEY `FKar2x8254rnxuwwjc7mjdj2ort` (`eno`),
  CONSTRAINT `FKar2x8254rnxuwwjc7mjdj2ort` FOREIGN KEY (`eno`) REFERENCES `estimate` (`eno`),
  CONSTRAINT `FKccqw0ag7vh1fbwgdgjj63tf27` FOREIGN KEY (`cargo_id`) REFERENCES `cargo_owner` (`cargo_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 테이블 데이터 bootex.matching:~3 rows (대략적) 내보내기
DELETE FROM `matching`;
INSERT INTO `matching` (`matching_no`, `accepted_time`, `is_accepted`, `cargo_id`, `eno`) VALUES
	(1, '2026-05-11 15:37:28.269749', b'1', 'test2', 1),
	(2, '2026-05-11 15:45:18.239706', b'1', 'test1234', 2),
	(3, '2026-06-18 10:54:34.205660', b'1', 'test2', 3);

-- 테이블 bootex.member 구조 내보내기
CREATE TABLE IF NOT EXISTS `member` (
  `mem_id` varchar(50) NOT NULL,
  `mem_address` varchar(255) DEFAULT NULL,
  `mem_create_id_datetime` datetime(6) NOT NULL,
  `mem_email` varchar(120) NOT NULL,
  `mem_name` varchar(60) NOT NULL,
  `mem_phone` varchar(30) DEFAULT NULL,
  `mem_pw` varchar(200) NOT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `social` bit(1) DEFAULT NULL,
  PRIMARY KEY (`mem_id`),
  UNIQUE KEY `UKl7a3n47ch2apjbm5rtcx2gsg1` (`mem_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 테이블 데이터 bootex.member:~2 rows (대략적) 내보내기
DELETE FROM `member`;
INSERT INTO `member` (`mem_id`, `mem_address`, `mem_create_id_datetime`, `mem_email`, `mem_name`, `mem_phone`, `mem_pw`, `profile_image`, `social`) VALUES
	('admin', NULL, '2026-05-11 14:45:24.745358', 'admin@admin.com', '관리자', '010-0000-0000', '$2a$10$OmECOhJb3kAViFDodrRq5OJw5719H.1Gcnqln3lkTW1kTNhNc6pfC', NULL, b'0'),
	('test1', NULL, '2026-05-11 14:45:24.811941', 'test1@test.com', '테스트화물주', '010-1111-1111', '$2a$10$rA8MsYg1.Itv8SrWlr9QrO.P5sPbobTDEOPftjfJst8/AJlgprdXq', '48b1984e-7ac2-4c0d-a6b1-4eb45796741b.png', b'0'),
	('test4321', '부산 해운대구 APEC로 21 a', '2026-05-11 17:26:18.639368', 'asoc1037@naver.com', 'qwer', '1111', '$2a$10$V16QTu89ToVC8nA5CIVMv.tdX8KJDk05tLoeuefUKpnfdVbBM7Ms6', NULL, b'0');

-- 테이블 bootex.member_coupon 구조 내보내기
CREATE TABLE IF NOT EXISTS `member_coupon` (
  `mcno` bigint(20) NOT NULL AUTO_INCREMENT,
  `expiry_date` datetime(6) DEFAULT NULL,
  `issued_at` datetime(6) DEFAULT NULL,
  `status` enum('ACTIVE','EXPIRED','USED') NOT NULL,
  `used_date` datetime(6) DEFAULT NULL,
  `cno` bigint(20) DEFAULT NULL,
  `mem_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`mcno`),
  KEY `FKpruphyqakmdip08n48a00iy4t` (`cno`),
  KEY `FKqd8wqn6wkjkancmgbt8wm5esp` (`mem_id`),
  CONSTRAINT `FKpruphyqakmdip08n48a00iy4t` FOREIGN KEY (`cno`) REFERENCES `coupon` (`cno`),
  CONSTRAINT `FKqd8wqn6wkjkancmgbt8wm5esp` FOREIGN KEY (`mem_id`) REFERENCES `member` (`mem_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 테이블 데이터 bootex.member_coupon:~0 rows (대략적) 내보내기
DELETE FROM `member_coupon`;

-- 테이블 bootex.member_roles 구조 내보내기
CREATE TABLE IF NOT EXISTS `member_roles` (
  `mem_id` varchar(50) NOT NULL,
  `role` varchar(30) DEFAULT NULL,
  KEY `FKcbirm4bf4e8k4j8ar99qh4mmw` (`mem_id`),
  CONSTRAINT `FKcbirm4bf4e8k4j8ar99qh4mmw` FOREIGN KEY (`mem_id`) REFERENCES `member` (`mem_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 테이블 데이터 bootex.member_roles:~2 rows (대략적) 내보내기
DELETE FROM `member_roles`;
INSERT INTO `member_roles` (`mem_id`, `role`) VALUES
	('admin', 'ADMIN'),
	('test1', 'USER');

-- 테이블 bootex.notice 구조 내보내기
CREATE TABLE IF NOT EXISTS `notice` (
  `notice_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `author_id` varchar(50) NOT NULL,
  `author_name` varchar(100) NOT NULL,
  `category` enum('GENERAL','SERVICE','SYSTEM','UPDATE') NOT NULL,
  `content` text NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `title` varchar(200) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `view_count` int(11) NOT NULL,
  PRIMARY KEY (`notice_id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 테이블 데이터 bootex.notice:~24 rows (대략적) 내보내기
DELETE FROM `notice`;
INSERT INTO `notice` (`notice_id`, `author_id`, `author_name`, `category`, `content`, `created_at`, `title`, `updated_at`, `view_count`) VALUES
	(1, 'admin001', '관리자', 'GENERAL', '화물 운송 플랫폼 이용방법에 대한 상세한 안내입니다.\n\n1. 회원가입 및 로그인\n2. 프로필 설정\n3. 견적 요청 방법\n4. 결제 및 정산 안내\n\n자세한 내용은 각 메뉴를 참고해주세요.', '2026-05-11 14:45:24.580324', '플랫폼 이용 가이드', '2026-05-11 14:45:24.580324', 64),
	(2, 'admin002', '시스템관리자', 'GENERAL', '새로운 회원님들을 위한 회원가입 절차를 안내드립니다.\n\n■ 화물주 회원가입\n- 기본 정보 입력\n- 이메일 인증\n- 사업자등록증 업로드 (선택)\n\n■ 차주 회원가입\n- 기본 정보 입력\n- 이메일 인증\n- 차량등록증 및 운전면허증 업로드\n- 관리자 승인 대기', '2026-05-11 14:45:24.583829', '회원가입 절차 안내', '2026-05-11 14:45:24.583829', 259),
	(3, 'admin003', '운영관리자', 'GENERAL', '효율적인 견적 요청을 위한 단계별 가이드입니다.\n\n1단계: 출발지/도착지 입력\n2단계: 화물 정보 입력 (종류, 무게, 부피)\n3단계: 희망 일시 선택\n4단계: 견적 요청 완료\n5단계: 차주 매칭 및 견적 확인\n6단계: 최종 계약 체결', '2026-05-11 14:45:24.586830', '견적 요청 및 매칭 프로세스', '2026-05-11 14:45:24.586830', 134),
	(4, 'admin001', '관리자', 'GENERAL', '투명하고 합리적인 운송료 산정 기준을 안내드립니다.\n\n■ 기본 요금\n- 거리별 기본 요금\n- 화물 종류별 추가 요금\n- 차량 종류별 요금\n\n■ 추가 요금\n- 야간/휴일 할증료\n- 긴급 배송 추가료\n- 대기료 및 상하차료\n\n정확한 견적은 시스템에서 자동 계산됩니다.', '2026-05-11 14:45:24.590830', '운송료 산정 기준 안내', '2026-05-11 14:45:24.590830', 224),
	(5, 'admin002', '시스템관리자', 'GENERAL', '모든 이용자의 안전한 거래를 위한 중요 안내사항입니다.\n\n⚠️ 주의사항\n- 플랫폼 외부 직접 거래 금지\n- 선불 요구 사기 주의\n- 개인정보 보호\n- 분쟁 시 고객센터 신고\n\n✅ 권장사항\n- 계약서 작성 및 보관\n- 배송 전후 사진 촬영\n- 정확한 정보 입력', '2026-05-11 14:45:24.594831', '안전한 거래를 위한 주의사항', '2026-05-11 14:45:24.594831', 67),
	(6, 'admin003', '운영관리자', 'GENERAL', '고객님들이 자주 문의하시는 질문들을 정리했습니다.\n\nQ: 회원가입은 무료인가요?\nA: 네, 회원가입 및 기본 서비스 이용은 무료입니다.\n\nQ: 취소 수수료가 있나요?\nA: 매칭 완료 후 2시간 이내 무료 취소 가능합니다.\n\nQ: 보험은 어떻게 되나요?\nA: 모든 등록 차주는 운송보험에 가입되어 있습니다.\n\n더 많은 질문은 고객센터를 이용해주세요.', '2026-05-11 14:45:24.597831', 'FAQ 자주 묻는 질문', '2026-05-11 14:45:24.597831', 84),
	(7, 'admin001', '관리자', 'SYSTEM', '안정적인 서비스 제공을 위한 정기 시스템 점검을 실시합니다.\n\n■ 점검 일시\n- 2024년 1월 15일 (월) 02:00 ~ 06:00\n\n■ 점검 내용\n- 서버 성능 최적화\n- 데이터베이스 정리\n- 보안 업데이트\n- 백업 시스템 점검\n\n점검 시간 중에는 서비스 이용이 제한될 수 있습니다.\n고객님의 양해 부탁드립니다.', '2026-05-11 14:45:24.601831', '[시스템] 정기 점검 안내 (1월)', '2026-05-11 14:45:24.601831', 169),
	(8, 'admin002', '시스템관리자', 'SYSTEM', '서버 성능 향상을 위한 서버 이전 작업이 완료되었습니다.\n\n■ 주요 개선사항\n- 응답속도 30% 향상\n- 동시접속자 처리 용량 확대\n- 데이터 백업 시스템 강화\n- 모니터링 시스템 고도화\n\n■ 변경사항\n- 서버 IP 주소 변경 (자동 연결)\n- API 응답 속도 개선\n\n더욱 빠르고 안정적인 서비스를 경험해보세요!', '2026-05-11 14:45:24.604832', '[시스템] 서버 이전 작업 완료', '2026-05-11 14:45:24.604832', 100),
	(9, 'admin003', '운영관리자', 'SYSTEM', '고객님의 개인정보 보호를 위한 보안 강화 조치를 완료했습니다.\n\n■ 강화된 보안 기능\n- SSL 인증서 업그레이드\n- 비밀번호 암호화 방식 개선\n- 2단계 인증 시스템 도입\n- 의심스러운 로그인 탐지\n\n■ 권장사항\n- 비밀번호 정기 변경 (3개월)\n- 복잡한 비밀번호 설정\n- 공용 PC에서 자동로그인 사용 금지\n\n안전한 서비스 이용을 위해 협조 부탁드립니다.', '2026-05-11 14:45:24.607830', '[시스템] 보안 강화 조치 완료', '2026-05-11 14:45:24.607830', 191),
	(10, 'admin001', '관리자', 'SYSTEM', '시스템 성능 향상을 위한 데이터베이스 최적화 작업이 완료되었습니다.\n\n■ 최적화 내용\n- 인덱스 재구성\n- 불필요한 데이터 정리\n- 쿼리 성능 튜닝\n- 백업 프로세스 개선\n\n■ 성능 개선 결과\n- 페이지 로딩 속도 25% 단축\n- 검색 기능 응답 시간 단축\n- 대용량 데이터 처리 안정성 향상\n\n쾌적한 서비스 이용이 가능합니다.', '2026-05-11 14:45:24.610829', '[시스템] 데이터베이스 최적화 완료', '2026-05-11 14:45:24.610829', 163),
	(11, 'admin002', '시스템관리자', 'SYSTEM', '모바일 앱 및 연동 시스템의 안정성 향상을 위한 API 업데이트를 실시했습니다.\n\n■ 주요 변경사항\n- REST API v2.1 배포\n- 응답 속도 최적화\n- 에러 처리 개선\n- 문서화 업데이트\n\n■ 개발자 공지\n- 기존 v2.0 API는 6개월간 병행 지원\n- 새로운 API 문서 확인 필요\n- 마이그레이션 가이드 제공\n\n기술 문의는 개발자 문의 게시판을 이용해주세요.', '2026-05-11 14:45:24.613829', '[시스템] API 버전 업데이트', '2026-05-11 14:45:24.613829', 93),
	(12, 'admin003', '운영관리자', 'SYSTEM', '서비스 품질 향상을 위한 실시간 모니터링 시스템을 도입했습니다.\n\n■ 모니터링 대상\n- 서버 성능 및 가용성\n- 응답시간 및 처리량\n- 에러 발생률\n- 사용자 경험 지표\n\n■ 장애 대응 체계\n- 24/7 자동 모니터링\n- 즉시 알림 시스템\n- 신속한 장애 복구\n- 사전 예방 조치\n\n더욱 안정적인 서비스를 제공하겠습니다.', '2026-05-11 14:45:24.620830', '[시스템] 모니터링 시스템 도입', '2026-05-11 14:45:24.620830', 56),
	(13, 'admin001', '관리자', 'SERVICE', '고객 요청에 따라 새로운 차량 유형을 추가했습니다.\n\n■ 추가된 차량 유형\n- 냉장/냉동 차량: 신선식품 운송\n- 윙바디 차량: 대형 화물 운송\n- 탑차: 귀중품 및 정밀기기 운송\n- 크레인 차량: 중장비 운송\n\n■ 특수 운송 서비스\n- 당일배송 서비스 확대\n- 새벽배송 서비스\n- 정시배송 보장 서비스\n\n더 다양한 운송 니즈에 부응하겠습니다.', '2026-05-11 14:45:24.623830', '[서비스] 새로운 차량 유형 추가', '2026-05-11 14:45:24.623830', 116),
	(14, 'admin002', '시스템관리자', 'SERVICE', '고객 요청이 많았던 실시간 위치 추적 기능을 정식 오픈합니다.\n\n■ 주요 기능\n- GPS 기반 실시간 위치 확인\n- 예상 도착시간 안내\n- 경로 최적화\n- 배송 완료 알림\n\n■ 이용 방법\n1. 운송 진행 중인 주문 선택\n2. "위치 추적" 버튼 클릭\n3. 실시간 위치 및 상태 확인\n\n■ 개인정보 보호\n- 운송 완료 후 위치정보 자동 삭제\n- 당사자만 위치 확인 가능', '2026-05-11 14:45:24.626831', '[서비스] 실시간 위치 추적 기능 오픈', '2026-05-11 14:45:24.626831', 342),
	(15, 'admin003', '운영관리자', 'SERVICE', '더 공정하고 투명한 평가 시스템으로 개선했습니다.\n\n■ 개선사항\n- 5점 평점제에서 10점제로 변경\n- 세부 평가 항목 추가\n  * 시간 준수\n  * 화물 취급\n  * 서비스 친절도\n  * 소통 원활성\n\n■ 평가 보상 시스템\n- 성실한 평가 작성 시 포인트 적립\n- 우수 평가 받은 차주 혜택 제공\n- 평가 조작 방지 시스템 강화\n\n공정한 거래 환경 조성에 동참해주세요.', '2026-05-11 14:45:24.628831', '[서비스] 고객 평가 시스템 개선', '2026-05-11 14:45:24.628831', 112),
	(16, 'admin001', '관리자', 'SERVICE', '고객 편의성 향상을 위해 24시간 고객센터 운영을 시작합니다.\n\n■ 운영 시간\n- 기존: 평일 09:00~18:00\n- 변경: 연중무휴 24시간\n\n■ 지원 채널\n- 전화상담: 1588-1234\n- 실시간 채팅\n- 이메일: support@example.com\n- 카카오톡 채널\n\n■ 긴급상황 대응\n- 운송 중 사고 신고\n- 분실/파손 신고\n- 시스템 장애 신고\n\n언제든지 편리하게 문의하세요!', '2026-05-11 14:45:24.631830', '[서비스] 24시간 고객센터 운영 시작', '2026-05-11 14:45:24.631830', 304),
	(17, 'admin002', '시스템관리자', 'SERVICE', '고객 감사 이벤트로 포인트 적립 혜택을 대폭 확대합니다.\n\n■ 적립 혜택 확대\n- 운송 완료 시: 기존 1% → 3%\n- 첫 이용 보너스: 5,000포인트\n- 추천인 보상: 추천인/피추천인 각 10,000포인트\n- 연속 이용 보너스: 월 3회 이상 추가 적립\n\n■ 포인트 사용처 확대\n- 운송료 결제\n- 편의점 상품권 교환\n- 주유권 교환\n- 기프티콘 교환\n\n더 많은 혜택을 누려보세요!', '2026-05-11 14:45:24.633837', '[서비스] 포인트 적립 혜택 확대', '2026-05-11 14:45:24.633837', 108),
	(18, 'admin003', '운영관리자', 'SERVICE', '고객의 재산 보호를 위해 운송보험 보장 범위를 확대합니다.\n\n■ 확대된 보장 내용\n- 화물 손해: 최대 1억원\n- 제3자 배상: 최대 5억원\n- 운송 지연 손해: 신설\n- 자연재해 손해: 신설\n\n■ 보상 절차 간소화\n- 온라인 신고 시스템\n- 신속한 현장 조사\n- 평균 처리기간 단축 (7일 → 3일)\n\n■ 예방 교육 강화\n- 차주 안전 교육 의무화\n- 화물 포장 가이드 제공\n\n안전하고 믿을 수 있는 운송 서비스를 제공합니다.', '2026-05-11 14:45:24.636829', '[서비스] 보험 보장 범위 확대', '2026-05-11 14:45:24.636829', 254),
	(19, 'admin001', '관리자', 'UPDATE', '새로운 기능이 추가된 모바일 앱 v2.5.0 업데이트를 배포했습니다.\n\n■ 새로운 기능\n- 다크 모드 지원\n- 음성 안내 기능\n- 오프라인 모드\n- 위젯 지원\n\n■ 개선사항\n- 배터리 사용량 20% 감소\n- 앱 실행 속도 향상\n- UI/UX 개선\n- 버그 수정 및 안정성 향상\n\n■ 업데이트 방법\n- 앱스토어/플레이스토어에서 업데이트\n- 자동 업데이트 설정 권장\n\n더 편리해진 앱을 경험해보세요!', '2026-05-11 14:45:24.638836', '[업데이트] 모바일 앱 v2.5.0 업데이트', '2026-05-11 14:45:24.638836', 196),
	(20, 'admin002', '시스템관리자', 'UPDATE', '더 직관적이고 사용하기 편한 웹사이트로 새단장했습니다.\n\n■ 주요 변경사항\n- 모던하고 깔끔한 디자인\n- 반응형 웹 완전 지원\n- 접근성 개선 (웹 접근성 인증)\n- 다국어 지원 준비\n\n■ 메뉴 구조 개선\n- 직관적인 네비게이션\n- 빠른 검색 기능\n- 개인화된 대시보드\n- 즐겨찾기 기능\n\n■ 성능 최적화\n- 페이지 로딩 속도 40% 향상\n- 이미지 최적화\n- 캐싱 시스템 적용\n\n새로워진 웹사이트를 만나보세요!', '2026-05-11 14:45:24.640829', '[업데이트] 웹사이트 디자인 리뉴얼', '2026-05-11 14:45:24.640829', 157),
	(21, 'admin003', '운영관리자', 'UPDATE', '더 안전하고 편리한 결제를 위해 결제 시스템을 업그레이드했습니다.\n\n■ 새로운 결제 수단\n- 카카오페이\n- 네이버페이\n- 페이코\n- 토스페이\n- 삼성페이\n\n■ 보안 강화\n- PCI DSS 인증 완료\n- 토큰 결제 시스템 도입\n- 이상거래 탐지 시스템\n- 3D Secure 2.0 적용\n\n■ 편의 기능\n- 간편 결제 설정\n- 자동 결제 기능\n- 결제 내역 상세 조회\n- 영수증 자동 발송\n\n안전하고 편리한 결제를 경험하세요.', '2026-05-11 14:45:24.643837', '[업데이트] 결제 시스템 업그레이드', '2026-05-11 14:45:24.643837', 215),
	(22, 'admin001', '관리자', 'UPDATE', '인공지능 기술을 활용한 스마트 견적 시스템을 도입했습니다.\n\n■ AI 견적 시스템 특징\n- 실시간 교통정보 반영\n- 과거 운송 데이터 학습\n- 날씨, 계절 요인 고려\n- 개인화된 견적 제공\n\n■ 정확성 향상\n- 예상 비용 오차 50% 감소\n- 배송 시간 예측 정확도 90%\n- 맞춤형 차주 추천\n- 최적 경로 제안\n\n■ 사용 방법\n- 기존과 동일한 견적 요청 과정\n- AI 분석 결과 자동 표시\n- 상세 분석 리포트 제공\n\n더 정확하고 합리적인 견적을 받아보세요!', '2026-05-11 14:45:24.645836', '[업데이트] AI 기반 견적 시스템 도입', '2026-05-11 14:45:24.645836', 205),
	(23, 'admin002', '시스템관리자', 'UPDATE', '중요한 정보를 놓치지 않도록 알림 시스템을 대폭 개선했습니다.\n\n■ 알림 유형 세분화\n- 즉시 알림: 긴급한 내용\n- 일반 알림: 일반적인 업데이트\n- 프로모션: 이벤트 및 할인 정보\n- 시스템: 점검 및 공지사항\n\n■ 맞춤 설정 기능\n- 알림 유형별 ON/OFF\n- 시간대별 수신 설정\n- 채널별 설정 (앱, SMS, 이메일)\n- 중요도별 필터링\n\n■ 스마트 알림\n- 사용 패턴 학습\n- 관련성 높은 알림 우선 발송\n- 중복 알림 방지\n\n개인화된 알림으로 더 편리하게 이용하세요.', '2026-05-11 14:45:24.647836', '[업데이트] 알림 시스템 개선', '2026-06-17 16:24:16.390823', 100),
	(24, 'admin003', '운영관리자', 'UPDATE', '데이터 기반 의사결정을 위한 통계 및 분석 기능을 추가했습니다.\n\n■ 제공 통계\n- 월별/분기별 운송 현황\n- 비용 분석 및 절감 효과\n- 자주 이용하는 경로\n- 선호 차주 및 평가 분석\n\n■ 시각화 도구\n- 대시보드 차트\n- 지도 기반 경로 분석\n- 비교 분석 그래프\n- 트렌드 분석\n\n■ 리포트 기능\n- PDF 리포트 다운로드\n- 이메일 자동 발송\n- 정기 리포트 설정\n- 맞춤형 리포트 생성\n\n데이터로 더 스마트한 운송 관리를 시작하세요!', '2026-05-11 14:45:24.649837', '[업데이트] 통계 및 분석 기능 추가', '2026-05-11 14:45:24.649837', 139);

-- 테이블 bootex.order_sheet 구조 내보내기
CREATE TABLE IF NOT EXISTS `order_sheet` (
  `order_no` bigint(20) NOT NULL AUTO_INCREMENT,
  `addressee` varchar(255) DEFAULT NULL,
  `addressee_email` varchar(255) DEFAULT NULL,
  `end_rest_address` varchar(255) DEFAULT NULL,
  `order_time` datetime(6) DEFAULT NULL,
  `order_uuid` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `start_rest_address` varchar(255) DEFAULT NULL,
  `total_price` bigint(20) NOT NULL,
  `matching_no` bigint(20) NOT NULL,
  PRIMARY KEY (`order_no`),
  UNIQUE KEY `UK14m2ceka3s1f87j6kiie4jb4l` (`order_uuid`),
  UNIQUE KEY `UK8b7wy66cb78c72ufthgb1cx4c` (`matching_no`),
  CONSTRAINT `FK60k2pcc08a9vcobmmydrppgp3` FOREIGN KEY (`matching_no`) REFERENCES `matching` (`matching_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 테이블 데이터 bootex.order_sheet:~0 rows (대략적) 내보내기
DELETE FROM `order_sheet`;

-- 테이블 bootex.payment 구조 내보내기
CREATE TABLE IF NOT EXISTS `payment` (
  `payment_no` bigint(20) NOT NULL AUTO_INCREMENT,
  `currency` varchar(255) DEFAULT NULL,
  `discount_price` bigint(20) NOT NULL,
  `easy_pay_provider` varchar(255) DEFAULT NULL,
  `final_price` bigint(20) NOT NULL,
  `paid_at` datetime(6) DEFAULT NULL,
  `payment_id` varchar(255) DEFAULT NULL,
  `payment_method` varchar(255) DEFAULT NULL,
  `payment_status` enum('CANCELLED','PAID','PARTIAL_CAHCELLED') NOT NULL,
  `total_price` bigint(20) NOT NULL,
  `order_sheet_no` bigint(20) NOT NULL,
  `mcno` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`payment_no`),
  UNIQUE KEY `UKqykxbh5qo0uurkitwx2ioovts` (`order_sheet_no`),
  UNIQUE KEY `UKh2cx18159w1evkp50cj9p8s8y` (`payment_id`),
  UNIQUE KEY `UK4h87vqfvb4cpyxj7iyk5vak5g` (`mcno`),
  CONSTRAINT `FKgtr602c7u21yr6wm5a2gfndi9` FOREIGN KEY (`mcno`) REFERENCES `member_coupon` (`mcno`),
  CONSTRAINT `FKm6ijyll0pd105ihrg9gbee9pu` FOREIGN KEY (`order_sheet_no`) REFERENCES `order_sheet` (`order_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 테이블 데이터 bootex.payment:~0 rows (대략적) 내보내기
DELETE FROM `payment`;

-- 테이블 bootex.qa_post 구조 내보내기
CREATE TABLE IF NOT EXISTS `qa_post` (
  `post_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `author_id` varchar(50) NOT NULL,
  `author_name` varchar(100) NOT NULL,
  `author_type` enum('ADMIN','CARGO','MEMBER') NOT NULL,
  `category` enum('BILLING','ETC','GENERAL','SERVICE','TECHNICAL') NOT NULL,
  `content` text NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `is_private` bit(1) NOT NULL,
  `title` varchar(200) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `view_count` int(11) NOT NULL,
  PRIMARY KEY (`post_id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 테이블 데이터 bootex.qa_post:~31 rows (대략적) 내보내기
DELETE FROM `qa_post`;
INSERT INTO `qa_post` (`post_id`, `author_id`, `author_name`, `author_type`, `category`, `content`, `created_at`, `is_private`, `title`, `updated_at`, `view_count`) VALUES
	(1, 'user001', '김민수', 'MEMBER', 'GENERAL', '회원가입 절차에 대해 자세히 알고 싶습니다. 어떤 정보가 필요한지 궁금합니다.', '2026-05-11 14:45:24.463813', b'1', '회원가입은 어떻게 하나요?', '2026-05-11 14:45:24.463813', 95),
	(2, 'user002', '박철수', 'CARGO', 'GENERAL', '차주로 등록하려면 어떤 서류가 필요한가요? 절차가 복잡한지도 궁금합니다.', '2026-05-11 14:45:24.467816', b'0', '차주 등록 방법을 알려주세요', '2026-05-11 14:45:24.467816', 17),
	(3, 'user003', '이영희', 'ADMIN', 'GENERAL', '플랫폼에서 화물주와 차주 역할이 어떻게 다른지 설명해주세요.', '2026-05-11 14:45:24.470816', b'0', '화물주와 차주의 차이점은 무엇인가요?', '2026-05-11 14:45:24.470816', 14),
	(4, 'cargo001', '최동욱', 'MEMBER', 'GENERAL', '플랫폼 이용 시 발생하는 수수료나 이용료에 대해 알고 싶습니다.', '2026-05-11 14:45:24.474823', b'0', '서비스 이용료는 얼마인가요?', '2026-05-11 14:45:24.474823', 11),
	(5, 'cargo002', '강지연', 'CARGO', 'GENERAL', '더 이상 서비스를 이용하지 않아서 탈퇴하고 싶습니다. 절차를 알려주세요.', '2026-05-11 14:45:24.478816', b'0', '탈퇴는 어떻게 하나요?', '2026-05-11 14:45:24.478816', 48),
	(6, 'admin001', '윤태현', 'ADMIN', 'GENERAL', '로그인 시 사용하는 비밀번호를 까먹었는데 어떻게 찾을 수 있나요?', '2026-05-11 14:45:24.482318', b'0', '비밀번호를 잊어버렸어요', '2026-05-11 14:45:24.482318', 86),
	(7, 'user001', '김민수', 'MEMBER', 'TECHNICAL', '모바일 앱을 사용하다가 자꾸 강제종료됩니다. 해결방법이 있을까요?', '2026-05-11 14:45:24.486322', b'0', '앱이 계속 멈춰요', '2026-05-11 14:45:24.486322', 85),
	(8, 'user002', '박철수', 'CARGO', 'TECHNICAL', '아이디와 비밀번호를 정확히 입력했는데도 로그인이 되지 않습니다.', '2026-05-11 14:45:24.489325', b'0', '로그인이 안 돼요', '2026-05-11 14:45:24.489325', 7),
	(9, 'user003', '이영희', 'ADMIN', 'TECHNICAL', '현재 위치가 실제 위치와 다르게 표시됩니다. 정확도를 높이는 방법이 있나요?', '2026-05-11 14:45:24.492329', b'1', 'GPS 위치가 정확하지 않아요', '2026-05-11 14:45:24.492329', 2),
	(10, 'cargo001', '최동욱', 'MEMBER', 'TECHNICAL', '새로운 견적이나 메시지가 와도 알림이 오지 않습니다.', '2026-05-11 14:45:24.495321', b'0', '푸시 알림이 오지 않아요', '2026-05-11 14:45:24.495321', 44),
	(11, 'cargo002', '강지연', 'CARGO', 'TECHNICAL', 'Internet Explorer로 접속하면 지원하지 않는다고 나오는데 다른 브라우저를 써야 하나요?', '2026-05-11 14:45:24.498336', b'0', '브라우저가 지원되지 않는다고 나와요', '2026-05-11 14:45:24.498336', 75),
	(12, 'admin001', '윤태현', 'ADMIN', 'TECHNICAL', '서류 파일을 업로드하려고 하는데 계속 실패합니다. 파일 크기 제한이 있나요?', '2026-05-11 14:45:24.501329', b'0', '파일 업로드가 안 돼요', '2026-05-11 14:45:24.501329', 50),
	(13, 'user001', '김민수', 'MEMBER', 'BILLING', '신용카드, 계좌이체 외에 다른 결제 방법도 지원하나요?', '2026-05-11 14:45:24.505321', b'0', '결제 수단은 어떤 것이 있나요?', '2026-05-11 14:45:24.505321', 50),
	(14, 'user002', '박철수', 'CARGO', 'BILLING', '같은 주문에 대해 결제가 두 번 이루어진 것 같습니다. 환불 가능한가요?', '2026-05-11 14:45:24.508329', b'0', '결제가 중복으로 되었어요', '2026-05-11 14:45:24.508329', 36),
	(15, 'user003', '이영희', 'ADMIN', 'BILLING', '사업자등록증이 있는데 세금계산서로 발행받을 수 있나요?', '2026-05-11 14:45:24.512329', b'0', '세금계산서 발행이 가능한가요?', '2026-05-11 14:45:24.512329', 95),
	(16, 'cargo001', '최동욱', 'MEMBER', 'BILLING', '차주로서 운송 완료 후 수수료 정산은 언제 이루어지나요?', '2026-05-11 14:45:24.515321', b'0', '수수료는 언제 정산되나요?', '2026-05-11 14:45:24.515321', 57),
	(17, 'cargo002', '강지연', 'CARGO', 'BILLING', '결제 진행 중에 오류가 발생했는데 다시 시도해야 하나요?', '2026-05-11 14:45:24.517329', b'1', '카드 결제 실패했어요', '2026-05-11 14:45:24.517329', 70),
	(18, 'admin001', '윤태현', 'ADMIN', 'BILLING', '취소나 환불 시 수수료가 발생하나요? 환불 절차를 알려주세요.', '2026-05-11 14:45:24.520329', b'0', '환불 정책이 궁금해요', '2026-05-11 14:45:24.520329', 10),
	(19, 'user001', '김민수', 'MEMBER', 'SERVICE', '화물 운송 견적을 요청하는 정확한 절차를 알고 싶습니다.', '2026-05-11 14:45:24.524322', b'0', '견적 요청은 어떻게 하나요?', '2026-05-11 14:45:24.524322', 52),
	(20, 'user002', '박철수', 'CARGO', 'SERVICE', '특정 차주를 지정해서 운송을 맡길 수 있는지 궁금합니다.', '2026-05-11 14:45:24.527329', b'0', '차주를 직접 선택할 수 있나요?', '2026-05-11 14:45:24.527329', 87),
	(21, 'user003', '이영희', 'ADMIN', 'SERVICE', '운송비 산정 기준이 거리인가요 아니면 화물 종류도 고려되나요?', '2026-05-11 14:45:24.530321', b'0', '운송료는 어떻게 결정되나요?', '2026-05-11 14:45:24.530321', 69),
	(22, 'cargo001', '최동욱', 'MEMBER', 'SERVICE', '실시간으로 화물 위치나 배송 상태를 추적할 수 있는 기능이 있나요?', '2026-05-11 14:45:24.533333', b'0', '배송 진행 상황을 확인할 수 있나요?', '2026-05-11 14:45:24.533333', 11),
	(23, 'cargo002', '강지연', 'CARGO', 'SERVICE', '당일 배송이나 응급 화물 운송도 플랫폼에서 처리 가능한가요?', '2026-05-11 14:45:24.536321', b'0', '긴급 배송도 가능한가요?', '2026-05-11 14:45:24.536321', 43),
	(24, 'admin001', '윤태현', 'ADMIN', 'SERVICE', '일반 트럭으로는 운송하기 어려운 대형 화물도 처리 가능한지 궁금합니다.', '2026-05-11 14:45:24.539322', b'0', '대형 화물도 운송 가능한가요?', '2026-05-11 14:45:24.539322', 25),
	(25, 'user001', '김민수', 'MEMBER', 'ETC', '문의사항이 있을 때 전화나 채팅으로 상담받을 수 있는 시간대를 알고 싶습니다.', '2026-05-11 14:45:24.549322', b'1', '고객센터 운영시간은 언제인가요?', '2026-05-11 14:45:24.549322', 96),
	(26, 'user002', '박철수', 'CARGO', 'ETC', '새로운 기능이 추가될 예정이 있나요? 업데이트 일정을 알려주세요.', '2026-05-11 14:45:24.554322', b'0', '앱 업데이트는 언제 되나요?', '2026-05-11 14:45:24.554322', 79),
	(27, 'user003', '이영희', 'ADMIN', 'ETC', '물류 회사를 운영하고 있는데 플랫폼과 제휴할 수 있나요?', '2026-05-11 14:45:24.558322', b'0', '제휴 업체가 되고 싶어요', '2026-05-11 14:45:24.558322', 55),
	(28, 'cargo001', '최동욱', 'MEMBER', 'ETC', '플랫폼에서 수집하는 개인정보의 보안은 어떻게 관리하고 계신가요?', '2026-05-11 14:45:24.563326', b'0', '개인정보는 어떻게 보호되나요?', '2026-05-11 15:49:22.217287', 46),
	(29, 'cargo002', '강지연', 'CARGO', 'ETC', '서비스 이용 중 문제가 있었는데 어디로 신고하면 되나요?', '2026-05-11 14:45:24.568326', b'0', '불만사항을 신고하고 싶어요', '2026-06-18 11:25:17.038555', 62),
	(30, 'admin001', '윤태현', 'ADMIN', 'ETC', '신규 회원 대상 이벤트나 할인 프로모션이 있는지 궁금합니다.', '2026-05-11 14:45:24.572324', b'0', '이벤트나 할인 혜택이 있나요?', '2026-05-11 15:49:20.137725', 9),
	(31, 'anonymous', '익명', 'MEMBER', 'BILLING', 'qwer1234', '2026-05-11 15:49:12.770339', b'0', 'qq', '2026-05-11 15:49:43.764976', 4);

-- 테이블 bootex.rejected_matching 구조 내보내기
CREATE TABLE IF NOT EXISTS `rejected_matching` (
  `rmno` bigint(20) NOT NULL AUTO_INCREMENT,
  `rejected_time` datetime(6) DEFAULT NULL,
  `cargo_owner_id` varchar(50) DEFAULT NULL,
  `estimate_no` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`rmno`),
  KEY `FKb5wpxit7s0lgrn0liy9mcs14k` (`cargo_owner_id`),
  KEY `FKewfxt3ia2n1iiqu7xamcrrxb3` (`estimate_no`),
  CONSTRAINT `FKb5wpxit7s0lgrn0liy9mcs14k` FOREIGN KEY (`cargo_owner_id`) REFERENCES `cargo_owner` (`cargo_id`),
  CONSTRAINT `FKewfxt3ia2n1iiqu7xamcrrxb3` FOREIGN KEY (`estimate_no`) REFERENCES `estimate` (`eno`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 테이블 데이터 bootex.rejected_matching:~0 rows (대략적) 내보내기
DELETE FROM `rejected_matching`;
INSERT INTO `rejected_matching` (`rmno`, `rejected_time`, `cargo_owner_id`, `estimate_no`) VALUES
	(1, '2026-05-11 15:33:55.004161', 'test1234', 1);

-- 테이블 bootex.review 구조 내보내기
CREATE TABLE IF NOT EXISTS `review` (
  `review_no` bigint(20) NOT NULL AUTO_INCREMENT,
  `comment` varchar(500) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `delivery_no` bigint(20) NOT NULL,
  `rating` decimal(2,1) NOT NULL,
  `target_cargo_id` varchar(255) NOT NULL,
  `writer_member_id` varchar(255) NOT NULL,
  PRIMARY KEY (`review_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 테이블 데이터 bootex.review:~0 rows (대략적) 내보내기
DELETE FROM `review`;

-- 테이블 bootex.review_image 구조 내보내기
CREATE TABLE IF NOT EXISTS `review_image` (
  `review_image_no` bigint(20) NOT NULL AUTO_INCREMENT,
  `image_path` varchar(255) NOT NULL,
  `sort_order` int(11) DEFAULT NULL,
  `thumbnail_path` varchar(255) NOT NULL,
  `review_no` bigint(20) NOT NULL,
  PRIMARY KEY (`review_image_no`),
  KEY `FK1w12aeij5n35n95gvfurtuaxj` (`review_no`),
  CONSTRAINT `FK1w12aeij5n35n95gvfurtuaxj` FOREIGN KEY (`review_no`) REFERENCES `review` (`review_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 테이블 데이터 bootex.review_image:~0 rows (대략적) 내보내기
DELETE FROM `review_image`;

-- 테이블 bootex.review_reply 구조 내보내기
CREATE TABLE IF NOT EXISTS `review_reply` (
  `reply_no` bigint(20) NOT NULL AUTO_INCREMENT,
  `cargo_owner_id` varchar(255) NOT NULL,
  `content` varchar(500) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `review_no` bigint(20) NOT NULL,
  PRIMARY KEY (`reply_no`),
  UNIQUE KEY `UK2e89olie201iwwwfuqd2hl` (`review_no`),
  CONSTRAINT `FK8xbl6r8kbkiqkiv2jidols13m` FOREIGN KEY (`review_no`) REFERENCES `review` (`review_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 테이블 데이터 bootex.review_reply:~0 rows (대략적) 내보내기
DELETE FROM `review_reply`;

-- 테이블 bootex.revoked_token 구조 내보내기
CREATE TABLE IF NOT EXISTS `revoked_token` (
  `jti` varchar(64) NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  PRIMARY KEY (`jti`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 테이블 데이터 bootex.revoked_token:~2 rows (대략적) 내보내기
DELETE FROM `revoked_token`;
INSERT INTO `revoked_token` (`jti`, `expires_at`) VALUES
	('33e519ac-f9ec-4030-b5fd-a3f967b90a42', '2026-06-29 10:40:49.000000'),
	('f8be159b-7bef-4a3c-b408-28791b2eb409', '2026-06-29 10:40:41.000000');

-- 테이블 bootex.social_account 구조 내보내기
CREATE TABLE IF NOT EXISTS `social_account` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) DEFAULT NULL,
  `linked_at` datetime(6) DEFAULT NULL,
  `login_id` varchar(50) DEFAULT NULL,
  `provider` enum('GOOGLE','KAKAO','NAVER') NOT NULL,
  `provider_user_id` varchar(128) NOT NULL,
  `signup_ticket` varchar(64) DEFAULT NULL,
  `signup_ticket_expire_at` datetime(6) DEFAULT NULL,
  `user_id` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKs9tx0ab77isnfu6p5hdb8m9i5` (`provider`,`provider_user_id`),
  KEY `idx_social_login_id` (`login_id`),
  KEY `idx_social_signup_ticket` (`signup_ticket`),
  KEY `idx_social_user` (`user_id`),
  CONSTRAINT `FKah23u4yr4tndot87l5x3rttoi` FOREIGN KEY (`user_id`) REFERENCES `user_index` (`login_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 테이블 데이터 bootex.social_account:~0 rows (대략적) 내보내기
DELETE FROM `social_account`;

-- 테이블 bootex.user_index 구조 내보내기
CREATE TABLE IF NOT EXISTS `user_index` (
  `login_id` varchar(50) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `provider` varchar(20) DEFAULT NULL,
  `provider_id` varchar(128) DEFAULT NULL,
  `role` enum('ADMIN','DRIVER','SHIPPER') NOT NULL,
  `suspend_end_at` datetime(6) DEFAULT NULL,
  `suspend_reason` varchar(500) DEFAULT NULL,
  `suspend_start_at` datetime(6) DEFAULT NULL,
  `suspended` bit(1) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`login_id`),
  UNIQUE KEY `uk_user_index_email` (`email`),
  UNIQUE KEY `uk_user_index_provider` (`provider`,`provider_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 테이블 데이터 bootex.user_index:~5 rows (대략적) 내보내기
DELETE FROM `user_index`;
INSERT INTO `user_index` (`login_id`, `created_at`, `email`, `provider`, `provider_id`, `role`, `suspend_end_at`, `suspend_reason`, `suspend_start_at`, `suspended`, `updated_at`) VALUES
	('admin', NULL, 'admin@admin.com', NULL, NULL, 'ADMIN', NULL, NULL, NULL, b'0', NULL),
	('test1', NULL, 'test1@test.com', NULL, NULL, 'SHIPPER', NULL, NULL, NULL, b'0', NULL),
	('test1234', '2026-05-11 14:51:43.598951', 'gktmdwns1037@gmail.com', 'LOCAL', 'test1234', 'DRIVER', NULL, NULL, NULL, b'0', '2026-05-11 14:51:43.598951'),
	('test2', NULL, 'test2@test.com', NULL, NULL, 'DRIVER', NULL, NULL, NULL, b'0', NULL),
	('test4321', '2026-05-11 17:26:18.561489', 'asoc1037@naver.com', 'LOCAL', 'test4321', 'SHIPPER', NULL, NULL, NULL, b'0', '2026-05-11 17:26:18.561489');

-- 테이블 bootex.user_report 구조 내보내기
CREATE TABLE IF NOT EXISTS `user_report` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `admin_read` bit(1) NOT NULL,
  `content` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `reporter_id` varchar(255) NOT NULL,
  `target_id` varchar(255) DEFAULT NULL,
  `target_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 테이블 데이터 bootex.user_report:~0 rows (대략적) 내보내기
DELETE FROM `user_report`;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
