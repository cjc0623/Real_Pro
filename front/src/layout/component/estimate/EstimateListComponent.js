import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import { InboxOutlined } from "@mui/icons-material";
import useCustomMove from "../../../hooks/useCustomMove";
import { useEffect, useState } from "react";
import { getEstimateList, postAccepted, postRejected } from "../../../api/estimateApi/estimateApi";
import PageComponent from "../common/PageComponent";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import dayjs from "dayjs";

const initState = {
  dtoList: [],
  pageNumList: [],
  pageRequestDTO: null,
  prev: false,
  next: false,
  totalCount: 0,
  prevPage: 0,
  nextPage: 0,
  tatalPage: 0,
  current: 0
};

const EstimateListComponent = () => {
  const { page, size, moveToList, refresh, setRefresh } = useCustomMove();
  const [serverData, setServerData] = useState(initState);
  const navigate = useNavigate();
  const { roles, email } = useSelector(state => state.login);

  const [openEstimateListAccept, setOpenEstimateListAccept] = useState(false);
  const [selectedEno, setSelectedEno] = useState(null);
  const [accepting, setAccepting] = useState(false);

  const safeRoles = Array.isArray(roles) ? roles : [];

  const isDriver = safeRoles.includes("ROLE_DRIVER");
  const isShipper = safeRoles.includes("ROLE_SHIPPER");
  const isAdmin = safeRoles.includes("ROLE_ADMIN"); // 수정: 관리자도 운송 접수 목록 접근 허용

  const canAcceptOrReject = isDriver; // 수정: 수락/거절 버튼은 차주만 표시

  useEffect(() => {
    let ignore = false;

    const run = async () => {
      const token = sessionStorage.getItem("accessToken");

      if (!token) {
        alert("로그인이 필요합니다.");
        navigate("/", { replace: true });
        return;
      }

      if (!email && roles.length === 0) return;

      // 수정: 차주, 화주, 관리자 모두 접근 가능
      if (!isDriver && !isShipper && !isAdmin) {
        if (!ignore) setServerData(initState);
        return;
      }

      try {
        const data = await getEstimateList({ page, size });
        if (!ignore) setServerData(data);
      } catch (err) {
        const status = err?.response?.status;
        const backend = err?.response?.data;
        const msg =
          backend?.message ||
          backend?.error ||
          (typeof backend === "string" ? backend : null) ||
          "목록을 불러오는 중 오류가 발생했습니다.";

        if (status === 401) {
          alert("로그인이 필요합니다.");
          navigate("/", { replace: true });
        } else if (status === 403) {
          alert("권한이 없습니다.");
          navigate("/", { replace: true });
        } else {
          alert(`[${status ?? "ERR"}] ${msg}`);
        }
      }
    };

    run();

    return () => {
      ignore = true;
    };
  }, [
    page,
    size,
    refresh,
    navigate,
    roles,
    email,
    isDriver,
    isShipper,
    isAdmin // 수정: 관리자 권한 의존성 추가
  ]);

  const handleCancelClose = () => {
    setOpenEstimateListAccept(false);
    setSelectedEno(null);
  };

  const clickRejected = (esNo) => {
    postRejected(esNo).then(() => {
      setRefresh(!refresh);
    });
  };

  const clickAccepted = (enNo) => {
    setOpenEstimateListAccept(true);
    setSelectedEno(enNo);
  };

  const handleClickFinalCheck = async () => {
    if (!selectedEno || accepting) return;

    try {
      setAccepting(true);
      await postAccepted(selectedEno);
      alert("견적이 수락되었습니다");
      setOpenEstimateListAccept(false);
      setSelectedEno(null);
      setRefresh(!refresh);
    } catch (e) {
      if (e.response && typeof e.response.data === "string") {
        alert(e.response.data);
      } else {
        alert("수락 처리 중 오류가 발생했습니다.");
      }
    } finally {
      setAccepting(false);
      setOpenEstimateListAccept(false);
    }
  };

  /* ── 공통 셀 sx ── */
  const headCellSx = {
    fontSize: '12px',
    fontWeight: 600,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    py: 1.5,
    borderBottom: '1px solid #e5e7eb',
    bgcolor: '#f9fafb',
  };

  const bodyCellSx = {
    fontSize: '13px',
    color: '#374151',
    py: 2,
    borderBottom: '1px solid #f3f4f6',
  };

  const renderData = (list) => {
    if (!list || list.length === 0) {
      return (
        <TableRow>
          {/* 수정: 차주만 수락/거절 컬럼 포함 */}
          <TableCell
            colSpan={canAcceptOrReject ? 9 : 7}
            align="center"
            sx={{ border: 0, py: 10 }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
              <InboxOutlined sx={{ fontSize: 40, color: '#d1d5db' }} />
              <Typography sx={{ fontSize: '14px', color: '#9ca3af' }}>
                접수된 견적 의뢰가 없습니다
              </Typography>
            </Box>
          </TableCell>
        </TableRow>
      );
    }

    return list.map((estimate) => (
      <TableRow
        key={estimate.eno}
        sx={{ '&:last-child td': { borderBottom: 0 }, '&:hover': { bgcolor: '#f9fafb' } }}
      >
        <TableCell align="center" sx={bodyCellSx}>No.{estimate.eno}</TableCell>
        <TableCell align="center" sx={bodyCellSx}>{estimate.route}</TableCell>
        <TableCell align="center" sx={bodyCellSx}>{estimate.distanceKm}</TableCell>
        <TableCell align="center" sx={bodyCellSx}>{estimate.cargoWeight}</TableCell>
        <TableCell align="center" sx={bodyCellSx}>
          {dayjs(estimate.startTime).format("YYYY년 MM월 DD일 A hh:mm")}
        </TableCell>
        <TableCell align="center" sx={bodyCellSx}>{estimate.cargoType}</TableCell>
        <TableCell align="center" sx={bodyCellSx}>{estimate.totalCost}</TableCell>

        {/* 수정: 차주만 수락/거절 버튼 표시, 화주/관리자는 숨김 */}
        {canAcceptOrReject && (
          <>
            <TableCell align="center" sx={bodyCellSx}>
              <Button
                variant="contained"
                size="small"
                onClick={() => clickAccepted(estimate.eno)}
                sx={{
                  borderRadius: '8px',
                  backgroundColor: '#16a34a',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '13px',
                  boxShadow: 'none',
                  '&:hover': { backgroundColor: '#15803d', boxShadow: 'none' },
                }}
              >
                수락
              </Button>
            </TableCell>
            <TableCell align="center" sx={bodyCellSx}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => clickRejected(estimate.eno)}
                sx={{
                  borderRadius: '8px',
                  borderColor: '#fca5a5',
                  color: '#DC2626',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '13px',
                  '&:hover': { borderColor: '#DC2626', backgroundColor: '#fff1f1' },
                }}
              >
                거절
              </Button>
            </TableCell>
          </>
        )}
      </TableRow>
    ));
  };

  return (
    <>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: '1px solid #f3f4f6', borderRadius: '12px', overflow: 'hidden' }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={headCellSx}>견적번호</TableCell>
              <TableCell align="center" sx={headCellSx}>출발 - 도착</TableCell>
              <TableCell align="center" sx={headCellSx}>거리(KM)</TableCell>
              <TableCell align="center" sx={headCellSx}>무게(KG)</TableCell>
              <TableCell align="center" sx={headCellSx}>출발 날짜</TableCell>
              <TableCell align="center" sx={headCellSx}>화물 종류</TableCell>
              <TableCell align="center" sx={headCellSx}>금액</TableCell>

              {/* 수정: 차주만 수락/거절 헤더 표시 */}
              {canAcceptOrReject && (
                <>
                  <TableCell align="center" sx={headCellSx}>수락</TableCell>
                  <TableCell align="center" sx={headCellSx}>거절</TableCell>
                </>
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {renderData(serverData.dtoList)}
          </TableBody>
        </Table>
      </TableContainer>

      <Box mt={2} display="flex" justifyContent="center" gap={1} sx={{ paddingBottom: 5 }}>
        <PageComponent serverData={serverData} movePage={moveToList} />
      </Box>

      <Dialog
        open={openEstimateListAccept}
        onClose={handleCancelClose}
        PaperProps={{ sx: { width: 400, height: 150, borderRadius: 2, p: 2 } }}
      >
        <DialogContent>
          <Typography fontSize={20} fontWeight="bold">
            해당 견적을 수락하시겠습니까?
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClickFinalCheck} color="error" disabled={accepting}>
            확인
          </Button>
          <Button onClick={handleCancelClose} color="inherit">
            아니요
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EstimateListComponent;