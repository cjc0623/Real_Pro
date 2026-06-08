import { Outlet } from "react-router-dom";
import AdminSidebar from "../../../common/AdminSidebar";
import { Box } from "@mui/material";
import ResponsiveAppBar from "../../../common/ResponsiveAppBar";

const AdminLayout = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <ResponsiveAppBar position="fixed" />
    <Box sx={{ display: 'flex', flexGrow: 1, pt: { xs: '56px', sm: '64px' } }}>
      <AdminSidebar />
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, backgroundColor: "#f3f4f6", minWidth: 0 }}>
        <Outlet />
      </Box>
    </Box>
  </Box>
);

export default AdminLayout;
