import axios from "axios";
import { API_SERVER_HOST } from "../serverConfig";

const PREFIX = `${API_SERVER_HOST}/fr/admin/dashboard`;

export const fetchDashboardData = async () => {
  const { data } = await axios.get(`${PREFIX}`);
  return data;
};
