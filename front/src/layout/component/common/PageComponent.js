import { Box, Pagination } from "@mui/material";
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const PageComponent = ({ serverData, movePage }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box display="flex" justifyContent="center">
      <Pagination
        count={serverData.totalPage || 1}
        page={serverData.current || 1}
        onChange={(_, value) => movePage({ page: value })}
        color="primary"
        size={isMobile ? "small" : "medium"}
        sx={{
          "& .MuiPaginationItem-root": { fontWeight: "bold", color: "#475569", borderRadius: "8px" },
          "& .MuiPaginationItem-root.Mui-selected": { bgcolor: "#2563eb", color: "#ffffff", "&:hover": { bgcolor: "#1d4ed8" } }
        }}
      />
    </Box>
  );
};

export default PageComponent;