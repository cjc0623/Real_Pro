import { API_BASE } from '../../../config';
// 🔒 [보안] Kakao REST 키를 브라우저에 노출하지 않도록 백엔드 프록시(/fr/maps/**) 경유로 호출

export const fetchCoordsByAddress = async (address) => {
  const url = `${API_BASE}/fr/maps/geocode?query=${encodeURIComponent(address)}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data.documents || data.documents.length === 0) {
    throw new Error("주소로 좌표를 찾을 수 없습니다.");
  }

  const loc = data.documents[0];
  return { lat: parseFloat(loc.y), lng: parseFloat(loc.x) };
};

export const calculateDistanceBetweenAddresses = async (startAddress, endAddress) => {
  try {
    const start = await fetchCoordsByAddress(startAddress);
    const end = await fetchCoordsByAddress(endAddress);

    const routeUrl = `${API_BASE}/fr/maps/directions?origin=${start.lng},${start.lat}&destination=${end.lng},${end.lat}`;
    const res = await fetch(routeUrl);
    const data = await res.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error("경로 데이터를 찾을 수 없습니다.");
    }

    const meters = data.routes[0].summary.distance;
    const km = (meters / 1000).toFixed(1);
    return km;
  } catch (error) {
    console.error("거리 계산 실패:", error.message);
    throw error;
  }
};
