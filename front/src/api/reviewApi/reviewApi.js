import axios from "axios";
import { API_SERVER_HOST } from "../serverConfig";

const prefix = `${API_SERVER_HOST}/g2i4/review`;

export const getDriverTrustScore = async (cargoId) => {
  const token = sessionStorage.getItem("accessToken");

  const res = await axios.get(`${prefix}/trust-score/${cargoId}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return res.data;
};

export const createReview = async (formData) => {
  const token = sessionStorage.getItem("accessToken");

  const res = await axios.post(`${prefix}/register`, formData, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return res.data;
};
export const getReviewByDeliveryNo = async (deliveryNo) => {
  const token =
    sessionStorage.getItem("accessToken");

  const res = await axios.get(`${prefix}/${deliveryNo}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return res.data;
};
export const getReviewExistsByDeliveryNo = async (deliveryNo) => {
  const token =
    sessionStorage.getItem("accessToken");

  const res = await axios.get(`${prefix}/exists/${deliveryNo}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return res.data;
};

export const getMyReviews = async () => {
  const token = sessionStorage.getItem("accessToken");

  const res = await axios.get(`${prefix}/my`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return res.data;
};

export const modifyReview = async (reviewNo, formData) => {
  const token = sessionStorage.getItem("accessToken");

  const res = await axios.put(`${prefix}/${reviewNo}`, formData, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return res.data;
};

export const deleteReview = async (reviewNo) => {
  const token = sessionStorage.getItem("accessToken");

  const res = await axios.delete(`${prefix}/${reviewNo}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return res.data;
};
export const getReceivedReviews = async () => {
  const token = sessionStorage.getItem("accessToken");

  const res = await axios.get(`${prefix}/received`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return res.data;
};

export const getMyReceivedReviewSummary = async () => {
  const token = sessionStorage.getItem("accessToken");

  const res = await axios.get(`${prefix}/summary/my`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return res.data;
};
export const getMyReviewsWithDriverId = async () => {
  const res = await axios.get(`${prefix}/my/with-driver-id`, {
    withCredentials: true,
  });
  return res.data;
};

export const getDriverProfileCard = async (cargoId) => {
  const res = await axios.get(`${prefix}/driver-profile/${cargoId}`, {
    withCredentials: true,
  });
  return res.data;
};
export const getDriverDetail = async (cargoId) => {
  const res = await axios.get(`${prefix}/driver-detail/${cargoId}`, {
    withCredentials: true,
  });
  return res.data;
};
export const getReviewByReviewNo = async (reviewNo) => {
  const token = sessionStorage.getItem("accessToken");

  const res = await axios.get(`${prefix}/detail/${reviewNo}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return res.data;
};
export const createReviewReply = async (reviewNo, content) => {
  const token = sessionStorage.getItem("accessToken");

  const res = await axios.post(
    `${prefix}/${reviewNo}/reply`,
    { content },
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  return res.data;
};

export const modifyReviewReply = async (reviewNo, content) => {
  const token = sessionStorage.getItem("accessToken");

  const res = await axios.put(
    `${prefix}/${reviewNo}/reply`,
    { content },
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  return res.data;
};

export const deleteReviewReply = async (reviewNo) => {
  const token = sessionStorage.getItem("accessToken");

  const res = await axios.delete(`${prefix}/${reviewNo}/reply`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return res.data;
};

export const getReviewReply = async (reviewNo) => {
  const token = sessionStorage.getItem("accessToken");

  const res = await axios.get(`${prefix}/${reviewNo}/reply`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return res.data;
};