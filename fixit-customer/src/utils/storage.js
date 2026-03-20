import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveCustomer = async (data) => {
  await AsyncStorage.setItem('customer_token', data.token);
  await AsyncStorage.setItem('customer_user', JSON.stringify(data.user));
};

export const getCustomer = async () => {
  const token = await AsyncStorage.getItem('customer_token');
  const user  = await AsyncStorage.getItem('customer_user');
  return { token, user: user ? JSON.parse(user) : null };
};

export const clearCustomer = async () => {
  await AsyncStorage.removeItem('customer_token');
  await AsyncStorage.removeItem('customer_user');
};
