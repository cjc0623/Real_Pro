import { useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";
import { useDispatch } from "react-redux";

import "./App.css";
import CargoLoadingScene from "./components/loading/CargoLoadingScene";
import FloatingButtons from "./components/FloatingButtons";
import root from "./router/root";
import { getUserInfoAsync } from "./slice/loginSlice";

function App() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    if (token) {
      dispatch(getUserInfoAsync());
    }
  }, [dispatch]);

  return (
    <>
      {loading && <CargoLoadingScene onComplete={() => setLoading(false)} />}
      <RouterProvider router={root} />
      <FloatingButtons />
    </>
  );
}

export default App;
