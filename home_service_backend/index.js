const express = require('express');
const cors = require('cors');
 const { createAccountTemplate, sendMail } = require('./Services/SendMail');

const app = express();
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3001', // React runs on 3001 (backend on 3000)
    credentials: true
}));

app.get('/', async (req, res) => {
    res.json({
        Status: "OK",
        Result: "Welcome to Home Service"
    });
});
/* ================= ADMIN  ROUTES ================= */
const AdminController = require('./Controllers/AdminController');
app.post("/Admin/SignUp", AdminController.saveRequest);
app.post("/Admin/SignIn", AdminController.signIn);
app.put("/Admin/ChangePassword", AdminController.changePassword);
app.put("/Admin/ChangeProfile", AdminController.changeProfile);
app.post("/Admin/ForgotPassword", AdminController.forgotPassword);
app.get("/Admin/AdminList", AdminController.adminList);
app.put("/Admin/ChangeStatus", AdminController.changeStatus);

/* ================= SERVICE CATEGORY ROUTES ================= */
const ServiceCategoryController = require("./Controllers/ServiceCategoryController");
app.post("/ServiceCategory/Create", ServiceCategoryController.createCategory);
app.put("/ServiceCategory/Update", ServiceCategoryController.updateCategory);
app.get("/ServiceCategory/List", ServiceCategoryController.categoryList);
app.get("/ServiceCategory/Get/:id", ServiceCategoryController.getCategoryById);
app.put("/ServiceCategory/Delete", ServiceCategoryController.deleteCategory);
app.get("/ServiceCategory/ActiveList", ServiceCategoryController.activeCategoryList);
app.get("/ServiceCategory/DeletedList", ServiceCategoryController.deletedCategoryList);
app.put("/ServiceCategory/Recover",     ServiceCategoryController.recoverCategory);


/* ================= SERVICE ROUTES ================= */
const ServiceController = require("./Controllers/ServiceController");
app.post("/Service/Create", ServiceController.createService);
app.put("/Service/Update", ServiceController.updateService);
app.get("/Service/List", ServiceController.serviceList);
app.get("/Service/Get/:id", ServiceController.getServiceById);
app.get("/Service/ByCategory/:categoryId", ServiceController.getServiceByCategoryId);
app.put("/Service/Delete", ServiceController.deleteService);
app.get("/Service/ActiveList", ServiceController.activeServiceList);
app.get("/Service/ByServiceman/:servicemanId", ServiceController.getServiceByServicemanId);
app.get("/Service/DeletedList", ServiceController.deletedServiceList);
app.put("/Service/Recover",     ServiceController.recoverService);

/* ================= SERVICEMEN ROUTES ================= */
const ServicemanController = require("./Controllers/ServicemanController");
app.post("/Serviceman/Register", ServicemanController.registerServiceman);
app.post("/Serviceman/SignIn", ServicemanController.signIn);
app.get("/Serviceman/List", ServicemanController.servicemanList);
app.post("/Serviceman/ForgotPassword", ServicemanController.forgotPassword);
app.put("/Serviceman/ChangePassword", ServicemanController.changePassword);
app.put("/Serviceman/UpdateAccount", ServicemanController.updateAccount);
app.put("/Serviceman/UpdateLocation", ServicemanController.updateLocation);
app.get("/Serviceman/ByCity/:city", ServicemanController.servicemanByCity);
app.get("/Serviceman/ById/:id", ServicemanController.servicemanById);
app.put("/Serviceman/ChangeStatus", ServicemanController.changeStatus);

/* ================= CUSTOMER ROUTES ================= */
const CustomerController = require("./Controllers/CustomerController");
app.post("/Customer/Register", CustomerController.registerCustomer);
app.post("/Customer/SignIn", CustomerController.signIn);
app.get("/Customer/List", CustomerController.customerList);
app.put("/Customer/ChangePassword", CustomerController.changePassword);
app.post("/Customer/ForgotPassword", CustomerController.forgotPassword);
// app.put("/Customer/UpdateAccount", CustomerController.updateAccount);
// app.get("/Customer/ByCity/:city", CustomerController.customerByCity);
// app.get("/Customer/ById/:id", CustomerController.customerById);

/* ================= SERVICEMEN SERVICE ROUTES ================= */
const ServicemanServiceController = require("./Controllers/ServicemanServiceController");
app.post("/ServicemanService/Apply", ServicemanServiceController.applyService);
app.get("/ServicemanService/List", ServicemanServiceController.list);
app.get("/ServicemanService/ByServiceman/:servicemanId", ServicemanServiceController.servicemanServices);
app.put("/ServicemanService/ChangeStatus", ServicemanServiceController.changeStatus);
// app.get("/ServicemanService/ByService/:serviceId", ServicemanServiceController.servicemanByServiceId);
// app.get("/ServicemanService/ByCityAndService", ServicemanServiceController.servicemanByCityAndService); 

/* ================= SERVICEMEN SLOT ROUTES ================= */
const ServicemanSlotController = require("./Controllers/ServicemanSlotController");
app.post("/ServicemanSlot/Create", ServicemanSlotController.createSlot);
app.get("/ServicemanSlot/Get/:id", ServicemanSlotController.getSlotById);
// app.get("/ServicemanSlot/ByServiceman/:servicemanId", ServicemanSlotController.slotsByServiceman);
// app.put("/ServicemanSlot/Update", ServicemanSlotController.updateSlot);
// app.put("/ServicemanSlot/Delete", ServicemanSlotController.deleteSlot);     

/* ================= BOOKING ROUTES ================= */
const BookingController = require("./Controllers/BookingController");
app.post("/Booking/Create", BookingController.createBooking);
app.put("/Booking/UpdateStatus", BookingController.updateBookingStatus);
app.get("/Booking/Customer/:customerId", BookingController.getBookingsByCustomer);
app.get("/Booking/List", BookingController.getAllBookings);
// app.get("/Booking/Serviceman/:servicemanId", BookingController.getBookingsByServiceman);
// app.get("/Booking/Details/:id", BookingController.getBookingDetails);
// app.get("/Booking/ByStatus/:status", BookingController.getBookingsByStatus);
// app.get("/Booking/ByDate/:date", BookingController.getBookingsByDate);
// app.get("/Booking/ByService/:serviceId", BookingController.getBookingsByServiceId);

/* ================= REVIEW ROUTES ================= */
const ReviewController = require("./Controllers/ReviewController");
app.post("/Review/Create", ReviewController.createReview);
app.get("/Review/Serviceman/:id", ReviewController.getReviewsByServiceman);
app.get("/Review/Service/:id", ReviewController.getReviewsByService);
app.get("/Review/List", ReviewController.getAllReviews);
// app.get("/Review/Customer/:id", ReviewController.getReviewsByCustomer);

/* ================= FEEDBACK ROUTES ================= */
const FeedbackController = require("./Controllers/FeedbackController");
app.post("/Feedback/Create", FeedbackController.createFeedback);
app.get("/Feedback/List", FeedbackController.feedbackList);
app.get("/Feedback/Customer/:customerId", FeedbackController.feedbackByCustomer);

/* ================= COMPLAINT ROUTES ================= */

const ComplaintController = require("./Controllers/ComplaintController");
app.post("/Complaint/Create", ComplaintController.createComplaint);
app.get("/Complaint/List", ComplaintController.complaintList);
app.get("/Complaint/Customer/:customerId", ComplaintController.getComplaintByCustomer);
app.put("/Complaint/UpdateStatus", ComplaintController.updateComplaintStatus);

/* ================= SERVICEMAN PAYMENT ROUTES ================= */

const ServicemanPaymentController = require("./Controllers/ServicemanPaymentController");
app.post("/ServicemanPayment/Create", ServicemanPaymentController.createPayment);
app.get("/ServicemanPayment/List", ServicemanPaymentController.paymentList);
app.get("/ServicemanPayment/Serviceman/:servicemanId", ServicemanPaymentController.paymentByServiceman);

/* ================= CUSTOMER ADDRESS ROUTES ================= */

const CustomerAddressController = require("./Controllers/CustomerAddressController");
app.post("/CustomerAddress/Create", CustomerAddressController.createAddress);
app.put("/CustomerAddress/Update", CustomerAddressController.updateAddress);
app.get("/CustomerAddress/List/:customerId", CustomerAddressController.addressList);
app.put("/CustomerAddress/SetDefault", CustomerAddressController.setDefaultAddress);
app.delete("/CustomerAddress/Delete/:id", CustomerAddressController.deleteAddress);

/* ================= COMMISSION ROUTES ================= */
const CommissionController = require("./Controllers/CommissionController");
app.post("/Commission/Create", CommissionController.createCommission);
app.get("/Commission/List", CommissionController.commissionList);
app.get("/Commission/Booking/:bookingId", CommissionController.getByBooking);
app.put("/Commission/Settle", CommissionController.settleCommission);


app.listen(3000, () => {
    console.log('http://localhost:3000');
}
);