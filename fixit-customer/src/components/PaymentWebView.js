import React, { useRef } from 'react';
import { WebView } from 'react-native-webview';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBooking } from '../utils/api';


export default function PaymentWebView({ route, navigation }) {
  const { amount } = route.params;
  const hasHandled = useRef(false); // prevent double trigger

  const html = `
  <html>
    <head>
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    </head>
    <body>
      <script>
        var options = {
          key: "rzp_test_jP3TtByYGUAeLp",
          amount: ${amount * 100},
          currency: "INR",
          name: "FixIt Services",
          description: "Service Booking",
          handler: function (response) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({ success: true, paymentId: response.razorpay_payment_id })
            );
          },
          modal: {
            ondismiss: function () {
              window.ReactNativeWebView.postMessage(
                JSON.stringify({ success: false })
              );
            }
          }
        };

        var rzp = new Razorpay(options);
        rzp.open();
      </script>
    </body>
  </html>
  `;

 const handleMessage = async (event) => {
  if (hasHandled.current) return;
  hasHandled.current = true;

  const data = JSON.parse(event.nativeEvent.data);

  // ❌ PAYMENT FAILED OR CANCELLED
  if (!data.success) {
    navigation.replace('PaymentFailed');
    return;
  }

  // ✅ PAYMENT SUCCESS
  try {
    const stored = await AsyncStorage.getItem('bookingDetails');
    const booking = stored ? JSON.parse(stored) : null;

    if (!booking) {
      navigation.replace('PaymentFailed');
      return;
    }

    const res = await createBooking({
      ...booking,
      paymentStatus: 'Paid',
      paymentId: data.paymentId,
    });

    if (res.data.Status === 'OK') {
      navigation.replace('PaymentSuccess');
    } else {
      navigation.replace('PaymentFailed');
    }

  } catch (err) {
    navigation.replace('PaymentFailed');
  }
};

  return (
    <WebView
      originWhitelist={['*']}
      source={{ html }}
      onMessage={handleMessage}
    />
  );
}