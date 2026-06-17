import { Outlet } from "react-router-dom";
import AdminSidebar from "../../../common/AdminSidebar";
import { Box } from "@mui/material";
import ResponsiveAppBar from "../../../common/ResponsiveAppBar";

const AdminLayout = () => (
  <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
    <ResponsiveAppBar />
    <Box sx={{ display: 'flex', flex: 1 }}>
      <AdminSidebar />
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 5 }, minWidth: 0 }}>
        <Outlet />
      </Box>
    </Box>
  </Box>
);

export default AdminLayout;
