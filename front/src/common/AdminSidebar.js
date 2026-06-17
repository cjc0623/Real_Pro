import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  Typography,
  Box,
  ListItemIcon,
  Avatar,
  Badge,
  Divider,
} from "@mui/material";
import {
  ExpandLess,
  ExpandMore,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Notifications as NotificationsIcon,
  AttachMoney as MoneyIcon,
} from "@mui/icons-material";
import PersonIcon from '@mui/icons-material/Person';
import { fetchUnreadCount } from "../api/adminApi/adminReportsApi";
import { useTheme, useMediaQuery } from "@mui/material";
import AdminBottomNav from '../common/AdminBottomNav';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

const drawerWidth = 260;
// ✅ 마이페이지와 동일한 헤더 높이 설정
const APPBAR_HEIGHT_MOBILE = 56;
const APPBAR_HEIGHT_DESKTOP = 100;

const AdminSidebar = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const groups = useMemo(() => ([
    {
      title: "이용 통계",
      icon: <DashboardIcon />,
      path: "/admin",
    },
    { title: "배송 조회", icon: <LocalShippingIcon />, path: "/admin/deliveryPage" },
    {
      title: "회원 관리",
      icon: <PeopleIcon />,
      id: "members",
      items: [
        { label: "차량 승인 관리", path: "/admin/AdminCargoApproval" },
        { label: "전체 회원", path: "/admin/memberAll" },
        { label: "물주", path: "/admin/memberOwner" },
        { label: "차주", path: "/admin/memberCowner" },
        { label: "신고내역", path: "/admin/memberReport", id: "reports" },
        { label: "관리자", path: "/admin/memberAdmin" },
      ],
    },
    {
      title: "공지/문의",
      icon: <NotificationsIcon />,
      id: "notice",
      items: [
        { label: "공지사항", path: "/admin/notice" },
        { label: "문의사항", path: "/admin/inquirie" },
      ],
    },
    {
      title: "운송료",
      icon: <MoneyIcon />,
      id: "fees",
      items: [
        { label: "기본요금", path: "/admin/feesBasic" },
        { label: "추가요금", path: "/admin/feesExtra" },
      ],
    },
  ]), []);

  const initialOpen = useMemo(() => {
    const map = {};
    groups.forEach(g => {
      if (g.items && g.items.some(it => it.path === location.pathname)) {
        map[g.title] = true;
      }
    });
    return map;
  }, [groups, location.pathname]);

  const [openGroups, setOpenGroups] = useState(initialOpen);

  const handleToggle = (groupTitle) => {
    setOpenGroups((prev) => ({ ...prev, [groupTitle]: !prev[groupTitle] }));
  };

  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const n = await fetchUnreadCount();
        if (mounted) setUnread(n || 0);
      } catch (e) {}
    };
    load();
    const handleReportRead = () => { load(); };
    window.addEventListener('reportRead', handleReportRead);
    const t = setInterval(load, 60000);
    return () => {
      mounted = false;
      clearInterval(t);
      window.removeEventListener('reportRead', handleReportRead);
    };
  }, []);

  const mobileTabs = useMemo(() => ([
    { label: "이용통계", icon: <DashboardIcon />, path: "/admin" },
    { label: "배송조회", icon: <LocalShippingIcon />, path: "/admin/deliveryPage" },
    { label: "회원관리", icon: <PeopleIcon />, path: "/admin/memberAll" },
    { label: "공지/문의", icon: <NotificationsIcon />, path: "/admin/notice" },
    { label: "운송료", icon: <MoneyIcon />, path: "/admin/feesBasic" },
  ]), []);

  // 🟢 [변경] 기존 12px에서 대시보드 메뉴들을 더 동글동글한 알약(Pill) 형태로 전면 가공 (16px)
  const listItemStyle = {
    borderRadius: "16px",
    mx: 2,
    mb: 0.8,
    py: 1.3, // 마이페이지 사이드바와 완벽한 대칭을 위해 세로 패딩 보정
    transition: "all 0.2s ease",
    "&:hover": { backgroundColor: "#f1f5f9" },
  };

  return (
    <>
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: 'border-box',
              position: 'sticky',
              top: { xs: APPBAR_HEIGHT_MOBILE, md: APPBAR_HEIGHT_DESKTOP },
              alignSelf: 'flex-start',
              backgroundColor: "#ffffff", 
              borderRight: "1px solid #e2e8f0", 
              height: `calc(100vh - ${APPBAR_HEIGHT_DESKTOP}px)`,
            },
          }}
        >
          <Box sx={{ paddingTop: "30px" }}>
            <Box sx={{ p: 2, textAlign: "center", mb: 2 }}>
              <Avatar
                sx={{
                  bgcolor: "#eff6ff", 
                  width: 64,
                  height: 64,
                  margin: "0 auto",
                  mb: 2,
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.12)" // 은은한 블루 입체그림자 매칭
                }}
              >
                <PersonIcon sx={{ color: "#2563eb", fontSize: 36 }} /> 
              </Avatar>
              <Typography variant="h6" fontWeight="900" color="#1e293b">
                관리자 페이지
              </Typography>
            </Box>

            <List disablePadding>
              {groups.map((group) =>
                group.items ? (
                  <Box key={group.title}>
                    <ListItemButton onClick={() => handleToggle(group.title)} sx={listItemStyle}>
                      {group.icon && (
                        <ListItemIcon sx={{ minWidth: 40, color: "#64748b" }}>
                          {group.icon}
                        </ListItemIcon>
                      )}
                      <ListItemText 
                        primary={group.title} 
                        primaryTypographyProps={{ fontWeight: 600, color: "#334155", fontSize: '0.95rem' }} 
                      />
                      {openGroups[group.title] ? <ExpandLess sx={{ color: "#94a3b8" }} /> : <ExpandMore sx={{ color: "#94a3b8" }} />}
                    </ListItemButton>

                    <Collapse in={openGroups[group.title]} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding sx={{ mb: 1 }}>
                        {group.items.map((item) => {
                          const active = location.pathname === item.path;
                          const isReports = item.id === "reports";
                          const primaryNode = isReports ? (
                            <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
                              <span>신고내역</span>
                              <Badge color="error" badgeContent={unread} max={99} overlap="circular" />
                            </Box>
                          ) : (
                            item.label
                          );

                          return (
                            <ListItemButton
                              key={item.label}
                              component={Link}
                              to={item.path}
                              selected={active}
                              sx={{ 
                                ...listItemStyle,
                                pl: 6,
                                py: 1.2,
                                // 🟢 활성화 시 동글동글 핏팅 및 원본 선명한 블루 매칭
                                "&.Mui-selected": { 
                                  backgroundColor: "#eff6ff",
                                  "&:hover": { backgroundColor: "#e0f2fe" }
                                }
                              }}
                            >
                              <ListItemText
                                primary={primaryNode}
                                primaryTypographyProps={{
                                  fontWeight: active ? 700 : 500,
                                  color: active ? "#2563eb" : "#64748b", 
                                  fontSize: "0.95rem"
                                }}
                              />
                            </ListItemButton>
                          );
                        })}
                      </List>
                    </Collapse>
                  </Box>
                ) : (
                  <ListItemButton
                    key={group.title}
                    component={Link}
                    to={group.path}
                    selected={location.pathname === group.path}
                    sx={{
                      ...listItemStyle,
                      mb: 1.5,
                      "&.Mui-selected": { 
                        backgroundColor: "#eff6ff",
                        "&:hover": { backgroundColor: "#e0f2fe" }
                      }
                    }}
                  >
                    {group.icon && (
                      <ListItemIcon sx={{ minWidth: 40, color: location.pathname === group.path ? "#2563eb" : "#64748b" }}>
                        {group.icon}
                      </ListItemIcon>
                    )}
                    <ListItemText
                      primary={group.title}
                      primaryTypographyProps={{
                        fontWeight: location.pathname === group.path ? 700 : 600,
                        color: location.pathname === group.path ? "#2563eb" : "#334155",
                      }}
                    />
                  </ListItemButton>
                )
              )}
            </List>
          </Box>
        </Drawer>
      )}

      {isMobile && (
        <AdminBottomNav tabs={mobileTabs} unread={unread} />
      )}
    </>
  );
};

export default AdminSidebar;