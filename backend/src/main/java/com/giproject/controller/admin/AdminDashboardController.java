package com.giproject.controller.admin;
import org.springframework.security.access.prepost.PreAuthorize;

import com.giproject.dto.admin.DashboardDataDTO;
import com.giproject.service.admin.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/fr/admin/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    @GetMapping
    public ResponseEntity<DashboardDataDTO> getDashboardData() {
        DashboardDataDTO dashboardData = adminDashboardService.getDashboardData();
        return ResponseEntity.ok(dashboardData);
    }
}
