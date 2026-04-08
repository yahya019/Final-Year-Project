const express = require('express');
const cors = require('cors');
 const { createAccountTemplate, sendMail } = require('./Services/SendMail');

const app = express();
app.use(express.json());
const path = require('path');
app.use('/Content', express.static(path.join(__dirname, 'Content')));
app.use(cors({
    origin: '*', // React runs on 3001 (backend on 3000)
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


/* ================= SERVICEMEN SERVICE ROUTES ================= */
const ServicemanServiceController = require("./Controllers/ServicemanServiceController");
app.post("/ServicemanService/Apply", ServicemanServiceController.applyService);
app.get("/ServicemanService/List", ServicemanServiceController.list);
app.get("/ServicemanService/ByServiceman/:servicemanId", ServicemanServiceController.servicemanServices);
app.put("/ServicemanService/ChangeStatus", ServicemanServiceController.changeStatus);
app.get("/ServicemanService/ByService/:serviceId", ServicemanServiceController.servicesByService);
app.put("/ServicemanService/Update", ServicemanServiceController.updateService);


/* ================= SERVICEMEN SLOT ROUTES ================= */
const ServicemanSlotController = require("./Controllers/ServicemanSlotController");
app.post("/ServicemanSlot/Create", ServicemanSlotController.createSlot);
app.get("/ServicemanSlot/Get/:id", ServicemanSlotController.getSlotById);
app.get("/ServicemanSlot/ByServiceman/:servicemanId", ServicemanSlotController.slotsByServiceman);
app.delete("/ServicemanSlot/Delete/:id", ServicemanSlotController.deleteSlot);     
app.put("/ServicemanSlot/Reduce", ServicemanSlotController.reduceSlot);

/* ================= BOOKING ROUTES ================= */
const BookingController = require("./Controllers/BookingController");
app.post("/Booking/Create", BookingController.createBooking);
app.put("/Booking/UpdateStatus", BookingController.updateBookingStatus);
app.get("/Booking/Customer/:customerId", BookingController.getBookingsByCustomer);
app.get("/Booking/List", BookingController.getAllBookings);
app.get("/Booking/Serviceman/:servicemanId", BookingController.getBookingsByServiceman);


/* ================= REVIEW ROUTES ================= */
const ReviewController = require("./Controllers/ReviewController");
app.post("/Review/Create", ReviewController.createReview);
app.get("/Review/Serviceman/:id", ReviewController.getReviewsByServiceman);
app.get("/Review/Service/:id", ReviewController.getReviewsByService);
app.get("/Review/List", ReviewController.getAllReviews);

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
app.get("/Commission/Serviceman/:servicemanId", CommissionController.getByServiceman);
app.put("/Commission/BulkSettle", CommissionController.bulkSettle);

// Razorpay Payment Page
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: 'rzp_test_SWWu7HqGefrC26',
  key_secret: 'opKliFtO8MPEi4tJKYd6Fp3N',
});

app.get('/payment-page', async (req, res) => {
  const { amount, name, email, contact, serviceName } = req.query;

  try {
    const order = await razorpay.orders.create({
      amount: Number(amount) * 100,
      currency: "INR"
    });

    res.send(`
      <html>
        <head>
          <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        </head>
        <body>
          <script>
            const options = {
              key: "${razorpay.key_id}",
              amount: "${order.amount}",
              currency: "INR",
              name: "FixIt",
              description: "${serviceName}",
              order_id: "${order.id}",

              handler: function (response) {

                // SEND DATA BACK TO APP
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: "PAYMENT_SUCCESS",
                  payment_id: response.razorpay_payment_id,
                  order_id: response.razorpay_order_id
                }));
              },

              prefill: {
                name: "${name}",
                email: "${email}",
                contact: "${contact}"
              },

              theme: {
                color: "#FF4D4D"
              },

              modal: {
                ondismiss: function () {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: "PAYMENT_CANCELLED"
                  }));
                }
              }
            };

            const rzp = new Razorpay(options);
            rzp.open();
          </script>
        </body>
      </html>
    `);

  } catch (err) {
    console.log("Razorpay Error:", err);
    res.send("Payment Error");
  }
});

app.listen(3000, '0.0.0.0', () => {
    console.log('Server running on port 3000');
});