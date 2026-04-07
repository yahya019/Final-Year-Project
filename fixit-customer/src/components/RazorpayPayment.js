// RazorpayPayment.js

import RazorpayCheckout from 'react-native-razorpay';
import { Alert } from 'react-native';

export const openRazorpay = async ({ amount, user, onSuccess, onFailure }) => {
  try {
    const options = {
      description: 'Service Booking Payment',
      image: 'https://your-logo-url.com/logo.png',
      currency: 'INR',

      // ⚠️ Amount in paise (₹500 = 50000)
      amount: amount * 100,

      key: 'rzp_test_SXPBVIjtWGyr2Z',

      name: 'FixIt Services',

      prefill: {
        email: user?.email || '',
        contact: user?.contactNumber || '',
        name: user?.fullName || '',
      },

      theme: { color: '#FF4D4D' },
    };

    const payment = await RazorpayCheckout.open(options);

    // ✅ SUCCESS
    onSuccess && onSuccess(payment);

  } catch (error) {
    // ❌ FAILURE
    onFailure && onFailure(error);
  }
};