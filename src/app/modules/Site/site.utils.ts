import HttpStatus from "http-status";
import config from "../../config";
import AppError from "../../erros/AppError";
export const getAddressFromCoordinates = async (
  lat: number,
  lng: number,
): Promise<string> => {
  const apiKey = config.GOOGLE_MAP_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== "OK" || !data.results.length) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Could not resolve address from coordinates",
    );
  }

  return data.results[0].formatted_address; // ✅ Human-readable address
};
