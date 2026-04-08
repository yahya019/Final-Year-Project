import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://10.241.161.126:3000';

const api = axios.create({ baseURL: BASE_URL, timeout: 10000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('customer_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// AUTH
export const customerLogin    = (data) => api.post('/Customer/SignIn', data);
export const customerRegister = (data) => api.post('/Customer/Register', data);
export const changePassword   = (data) => api.put('/Customer/ChangePassword', data);

// CATEGORIES & SERVICES
export const getCategories         = ()     => api.get('/ServiceCategory/List');
export const getServicesByCategory = (id)   => api.get(`/Service/ByCategory/${id}`);
export const getServicemenByCity   = (city) => api.get(`/Serviceman/ByCity/${city}`);
export const getServiceById        = (id)   => api.get(`/Service/Get/${id}`);

// SERVICEMAN
export const getServicemanById     = (id)   => api.get(`/Serviceman/ById/${id}`);
export const getServicemanServices = (id)   => api.get(`/ServicemanService/ByService/${id}`);
export const getSlotsByServiceman  = (id)   => api.get(`/ServicemanSlot/ByServiceman/${id}`);
export const getReviewsByServiceman= (id)   => api.get(`/Review/Serviceman/${id}`);

// BOOKINGS
export const createBooking         = (data) => api.post('/Booking/Create', data);
export const getMyBookings         = (id)   => api.get(`/Booking/Customer/${id}`);
export const updateBookingStatus   = (data) => api.put('/Booking/UpdateStatus', data);

// REVIEWS
export const createReview          = (data) => api.post('/Review/Create', data);

// COMPLAINTS
export const createComplaint       = (data) => api.post('/Complaint/Create', data);
export const getMyComplaints       = (id)   => api.get(`/Complaint/Customer/${id}`);

// ADDRESS
export const getMyAddresses        = (id)   => api.get(`/CustomerAddress/List/${id}`);
export const createAddress         = (data) => api.post('/CustomerAddress/Create', data);
export const updateAddress         = (data) => api.put('/CustomerAddress/Update', data);
export const deleteAddress         = (id)   => api.delete(`/CustomerAddress/Delete/${id}`);
export const setDefaultAddress     = (data) => api.put('/CustomerAddress/SetDefault', data);

export default api;
