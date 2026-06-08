import { Outlet } from "react-router-dom";

import { Box } from "@mui/material";
import AdminSidebar from "../common/AdminSidebar";
import ResponsiveAppBar from "../common/ResponsiveAppBar";

const AdminPage = () => (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <ResponsiveAppBar position="fixed" />
        <Box sx={{ display: "flex", flex: 1, pt: { xs: "56px", sm: "64px" } }}>
            <AdminSidebar />
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 2, sm: 3 },
                    minWidth: 0,
                    backgroundColor: "#f3f4f6",
                }}
            >
                <Outlet />
            </Box>
        </Box>
    </Box>
);

export default AdminPage;
