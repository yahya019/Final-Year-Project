import axios from 'axios';

// ─── BASE URL ─────────────────────────────────────────────────────────────────
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fixit_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 → redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fixit_admin_token');
      localStorage.removeItem('fixit_admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Helper — check if response is OK
export const isOK = (res) => res?.data?.Status === 'OK';

// ─── ADMIN ────────────────────────────────────────────────────────────────────
// POST /Admin/SignIn          { Email, Password }
export const adminSignIn         = (Email, Password) => api.post('/Admin/SignIn', { Email, Password });
// POST /Admin/SignUp          { Name, Email, ContactNo, Role, Status }
export const adminSignUp         = (data)            => api.post('/Admin/SignUp', data);
// PUT  /Admin/ChangePassword  — backend expects { _id, OldPassword, NewPassword } (capital letters!)
export const adminChangePassword = (data) => api.put('/Admin/ChangePassword', data);
// PUT  /Admin/ChangeProfile   { _id, Name, Email, ContactNo }
export const adminChangeProfile  = (_id, Name, Email, ContactNo)   => api.put('/Admin/ChangeProfile', { _id, Name, Email, ContactNo });
// POST /Admin/ForgotPassword  { Email }
export const adminForgotPassword = (Email)           => api.post('/Admin/ForgotPassword', { Email });
// GET  /Admin/AdminList
export const getAdminList        = ()                => api.get('/Admin/AdminList');
// PUT  /Admin/ChangeStatus    { Id, Status }
export const adminChangeStatus   = (Id, Status)      => api.put('/Admin/ChangeStatus', { Id, Status });

// ─── SERVICE CATEGORY ─────────────────────────────────────────────────────────
// GET  /ServiceCategory/List
export const getServiceCategories    = ()     => api.get('/ServiceCategory/List');
// GET  /ServiceCategory/ActiveList
export const getActiveServiceCategories = ()  => api.get('/ServiceCategory/ActiveList');
// GET  /ServiceCategory/Get/:id
export const getServiceCategoryById  = (id)   => api.get(`/ServiceCategory/Get/${id}`);
// POST /ServiceCategory/Create
export const createServiceCategory   = (data) => api.post('/ServiceCategory/Create', data);
// PUT  /ServiceCategory/Update
export const updateServiceCategory   = (data) => api.put('/ServiceCategory/Update', data);
// PUT  /ServiceCategory/Delete
export const deleteServiceCategory   = (id)   => api.put('/ServiceCategory/Delete', { id });

// ─── SERVICE ──────────────────────────────────────────────────────────────────
// GET  /Service/List
export const getServices             = ()            => api.get('/Service/List');
// GET  /Service/ActiveList
export const getActiveServices       = ()            => api.get('/Service/ActiveList');
// GET  /Service/Get/:id
export const getServiceById          = (id)          => api.get(`/Service/Get/${id}`);
// GET  /Service/ByCategory/:categoryId
export const getServiceByCategory    = (categoryId)  => api.get(`/Service/ByCategory/${categoryId}`);
// POST /Service/Create
export const createService           = (data)        => api.post('/Service/Create', data);
// PUT  /Service/Update
export const updateService           = (data)        => api.put('/Service/Update', data);
// PUT  /Service/Delete
export const deleteService           = (id)          => api.put('/Service/Delete', { id });

// ─── SERVICEMAN ───────────────────────────────────────────────────────────────
// GET  /Serviceman/List
export const getAllServicemen         = ()            => api.get('/Serviceman/List');
// GET  /Serviceman/ById/:id
export const getServicemen           = ()           => api.get('/Serviceman/List');
export const getServicemanById       = (id)          => api.get(`/Serviceman/ById/${id}`);
// GET  /Serviceman/ByCity/:city
export const getServicemanByCity     = (city)        => api.get(`/Serviceman/ByCity/${city}`);
// PUT  /Serviceman/ChangeStatus       { Id, Status }  → use for Approve/Reject too
export const changeServicemanStatus  = (data)        => api.put('/Serviceman/ChangeStatus', data);
// Approve = set Status to "Active", Reject = set Status to "Rejected"
export const approveServiceman       = (Id)          => api.put('/Serviceman/ChangeStatus', { Id, Status: 'Active' });
export const rejectServiceman        = (Id)          => api.put('/Serviceman/ChangeStatus', { Id, Status: 'Rejected' });

// ─── SERVICEMAN SERVICE ───────────────────────────────────────────────────────
// GET  /ServicemanService/List
export const getServicemanServices   = ()            => api.get('/ServicemanService/List');
// GET  /ServicemanService/ByServiceman/:servicemanId
export const getServicesByServiceman = (id)          => api.get(`/ServicemanService/ByServiceman/${id}`);
// PUT  /ServicemanService/ChangeStatus  { Id, Status }
export const changeServicemanServiceStatus = (data)       => api.put('/ServicemanService/ChangeStatus', data); // { _id, status, adminRemark }

// ─── CUSTOMER ─────────────────────────────────────────────────────────────────
// GET  /Customer/List
export const getAllCustomers          = ()            => api.get('/Customer/List');
export const getCustomers             = ()            => api.get('/Customer/List');

// ─── BOOKING ──────────────────────────────────────────────────────────────────
// GET  /Booking/Customer/:customerId
export const getBookingsByCustomer   = (customerId)  => api.get(`/Booking/Customer/${customerId}`);
// PUT  /Booking/UpdateStatus          { bookingId, bookingStatus }
export const updateBookingStatus     = (data)        => api.put('/Booking/UpdateStatus', data); // { bookingId, bookingStatus }
// GET  /Booking/List  (add this route to your backend — see instructions)
export const getAllBookings           = ()            => api.get('/Booking/List');
// POST /Booking/Create
export const createBooking           = (data)        => api.post('/Booking/Create', data);

// ─── REVIEW ───────────────────────────────────────────────────────────────────
// GET  /Review/Serviceman/:id
export const getReviewsByServiceman  = (id)          => api.get(`/Review/Serviceman/${id}`);
// GET  /Review/Service/:id
export const getReviewsByService     = (id)          => api.get(`/Review/Service/${id}`);

// ─── FEEDBACK ─────────────────────────────────────────────────────────────────
// GET  /Feedback/List
export const getAllFeedback           = ()            => api.get('/Feedback/List');
// GET  /Feedback/Customer/:customerId
export const getFeedbackByCustomer   = (customerId)  => api.get(`/Feedback/Customer/${customerId}`);

// ─── COMPLAINT ────────────────────────────────────────────────────────────────
// GET  /Complaint/List
export const getAllComplaints         = ()            => api.get('/Complaint/List');
// GET  /Complaint/Customer/:customerId
export const getComplaintByCustomer  = (customerId)  => api.get(`/Complaint/Customer/${customerId}`);
// PUT  /Complaint/UpdateStatus        { Id, Status }
export const updateComplaintStatus   = (Id, Status)  => api.put('/Complaint/UpdateStatus', { Id, Status });

// ─── SERVICEMAN PAYMENT / SETTLEMENT ──────────────────────────────────────────
// GET  /ServicemanPayment/List
export const getAllPayments           = ()            => api.get('/ServicemanPayment/List');
// GET  /ServicemanPayment/Serviceman/:servicemanId
export const getPaymentsByServiceman = (id)          => api.get(`/ServicemanPayment/Serviceman/${id}`);

// ─── COMMISSION ───────────────────────────────────────────────────────────────
// GET  /Commission/List
export const getCommissions          = ()            => api.get('/Commission/List');
// GET  /Commission/Booking/:bookingId
export const getCommissionByBooking  = (bookingId)   => api.get(`/Commission/Booking/${bookingId}`);
// PUT  /Commission/Settle             { Id }
export const settleCommission        = (data)        => api.put('/Commission/Settle', data); // { id }

// ─── CUSTOMER ADDRESS ─────────────────────────────────────────────────────────
// GET  /CustomerAddress/List/:customerId
export const getAddressByCustomer    = (customerId)  => api.get(`/CustomerAddress/List/${customerId}`);

export default api;

// ─── RECOVER (soft delete restore) ────────────────────────────────────────────
// These routes need to be added to your backend (see instructions)
export const recoverServiceCategory = (id) => api.put('/ServiceCategory/Recover', { id });
export const recoverService         = (id) => api.put('/Service/Recover', { id });

// GET  /Review/List
export const getAllReviews = () => api.get('/Review/List');
