import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://10.137.238.126:3000';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('serviceman_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const servicemanLogin    = (data) => api.post('/Serviceman/SignIn', data);
export const servicemanRegister = (data) => api.post('/Serviceman/Register', data);
export const changePassword     = (data) => api.put('/Serviceman/ChangePassword', data);
export const forgotPassword     = (data) => api.post('/Serviceman/ForgotPassword', data);
export const getProfile         = (id)   => api.get(`/Serviceman/Profile/${id}`);
export const updateProfile      = (data) => api.put('/Serviceman/UpdateProfile', data);
export const getServiceCategories  = ()     => api.get('/ServiceCategory/List');
export const getServicesByCategory = (id)   => api.get(`/Service/ByCategory/${id}`);
export const applyForService       = (data) => api.post('/ServicemanService/Apply', data);
export const getMyServices         = (id)   => api.get(`/ServicemanService/ByServiceman/${id}`);
export const getMySlots            = (id)   => api.get(`/ServicemanSlot/ByServiceman/${id}`);
export const addSlot               = (data) => api.post('/ServicemanSlot/Create', data);
export const deleteSlot            = (id)   => api.delete(`/ServicemanSlot/Delete/${id}`);
export const getMyBookings         = (id)   => api.get(`/Booking/Serviceman/${id}`);
export const updateBookingStatus   = (data) => api.put('/Booking/UpdateStatus', data);
export const getMyEarnings         = (id)   => api.get(`/Commission/Serviceman/${id}`);
export const getMyReviews          = (id)   => api.get(`/Review/Serviceman/${id}`);

export default api;
