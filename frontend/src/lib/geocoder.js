// Static city → [lat, lng] lookup for fraud heatmap.
// Covers major global financial hubs + all cities present in sample data.
const COORDS = {
  // Nigeria
  'Lagos, NG': [6.4541, 3.3947],
  'Abuja, NG': [9.0765, 7.3986],
  'Port Harcourt, NG': [4.8156, 7.0498],
  'Kano, NG': [11.9964, 8.5167],
  'Ibadan, NG': [7.3775, 3.9470],
  'Enugu, NG': [6.4584, 7.5464],
  'Benin City, NG': [6.3350, 5.6270],
  'Calabar, NG': [4.9757, 8.3417],

  // UK / Europe
  'London, UK': [51.5074, -0.1278],
  'Manchester, UK': [53.4808, -2.2426],
  'Birmingham, UK': [52.4862, -1.8904],
  'Edinburgh, UK': [55.9533, -3.1883],
  'Berlin, DE': [52.5200, 13.4050],
  'Munich, DE': [48.1351, 11.5820],
  'Frankfurt, DE': [50.1109, 8.6821],
  'Paris, FR': [48.8566, 2.3522],
  'Lyon, FR': [45.7640, 4.8357],
  'Amsterdam, NL': [52.3676, 4.9041],
  'Brussels, BE': [50.8503, 4.3517],
  'Madrid, ES': [40.4168, -3.7038],
  'Barcelona, ES': [41.3851, 2.1734],
  'Rome, IT': [41.9028, 12.4964],
  'Milan, IT': [45.4642, 9.1900],
  'Zurich, CH': [47.3769, 8.5417],
  'Geneva, CH': [46.2044, 6.1432],
  'Vienna, AT': [48.2082, 16.3738],
  'Warsaw, PL': [52.2297, 21.0122],
  'Stockholm, SE': [59.3293, 18.0686],
  'Oslo, NO': [59.9139, 10.7522],
  'Copenhagen, DK': [55.6761, 12.5683],
  'Helsinki, FI': [60.1699, 24.9384],
  'Lisbon, PT': [38.7169, -9.1395],
  'Athens, GR': [37.9838, 23.7275],
  'Budapest, HU': [47.4979, 19.0402],
  'Prague, CZ': [50.0755, 14.4378],

  // North America
  'New York, US': [40.7128, -74.0060],
  'Los Angeles, US': [34.0522, -118.2437],
  'Chicago, US': [41.8781, -87.6298],
  'Houston, US': [29.7604, -95.3698],
  'Miami, US': [25.7617, -80.1918],
  'Austin, US': [30.2672, -97.7431],
  'San Francisco, US': [37.7749, -122.4194],
  'Seattle, US': [47.6062, -122.3321],
  'Boston, US': [42.3601, -71.0589],
  'Dallas, US': [32.7767, -96.7970],
  'Atlanta, US': [33.7490, -84.3880],
  'Washington, US': [38.9072, -77.0369],
  'Toronto, CA': [43.6532, -79.3832],
  'Vancouver, CA': [49.2827, -123.1207],
  'Montreal, CA': [45.5017, -73.5673],
  'Mexico City, MX': [19.4326, -99.1332],

  // South America
  'São Paulo, BR': [-23.5505, -46.6333],
  'Rio de Janeiro, BR': [-22.9068, -43.1729],
  'Buenos Aires, AR': [-34.6037, -58.3816],
  'Bogotá, CO': [4.7110, -74.0721],
  'Lima, PE': [-12.0464, -77.0428],
  'Santiago, CL': [-33.4489, -70.6693],
  'Quito, EC': [-0.1807, -78.4678],
  'Caracas, VE': [10.4806, -66.9036],

  // Africa
  'Cairo, EG': [30.0444, 31.2357],
  'Nairobi, KE': [-1.2921, 36.8219],
  'Johannesburg, ZA': [-26.2041, 28.0473],
  'Cape Town, ZA': [-33.9249, 18.4241],
  'Accra, GH': [5.6037, -0.1870],
  'Dakar, SN': [14.7167, -17.4677],
  'Casablanca, MA': [33.5731, -7.5898],
  'Addis Ababa, ET': [9.0249, 38.7469],
  'Kampala, UG': [0.3476, 32.5825],
  'Dar es Salaam, TZ': [-6.7924, 39.2083],

  // Middle East
  'Dubai, AE': [25.2048, 55.2708],
  'Abu Dhabi, AE': [24.4539, 54.3773],
  'Riyadh, SA': [24.6877, 46.7219],
  'Doha, QA': [25.2854, 51.5310],
  'Kuwait City, KW': [29.3759, 47.9774],
  'Tel Aviv, IL': [32.0853, 34.7818],
  'Istanbul, TR': [41.0082, 28.9784],
  'Beirut, LB': [33.8938, 35.5018],

  // Asia-Pacific
  'Singapore, SG': [1.3521, 103.8198],
  'Tokyo, JP': [35.6762, 139.6503],
  'Osaka, JP': [34.6937, 135.5023],
  'Seoul, KR': [37.5665, 126.9780],
  'Shanghai, CN': [31.2304, 121.4737],
  'Beijing, CN': [39.9042, 116.4074],
  'Hong Kong, HK': [22.3193, 114.1694],
  'Mumbai, IN': [19.0760, 72.8777],
  'Delhi, IN': [28.7041, 77.1025],
  'Bangalore, IN': [12.9716, 77.5946],
  'Bangkok, TH': [13.7563, 100.5018],
  'Jakarta, ID': [-6.2088, 106.8456],
  'Kuala Lumpur, MY': [3.1390, 101.6869],
  'Manila, PH': [14.5995, 120.9842],
  'Sydney, AU': [-33.8688, 151.2093],
  'Melbourne, AU': [-37.8136, 144.9631],
  'Auckland, NZ': [-36.8485, 174.7633],
};

export function geocode(location) {
  if (!location) return null;
  return COORDS[location] ?? null;
}

export function getCoordsMap() {
  return COORDS;
}
