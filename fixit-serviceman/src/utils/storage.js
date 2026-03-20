import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveServiceman = async (data) => {
  await AsyncStorage.setItem('serviceman_token', data.token);
  await AsyncStorage.setItem('serviceman_user', JSON.stringify(data.user));
};

export const getServiceman = async () => {
  const token = await AsyncStorage.getItem('serviceman_token');
  const user  = await AsyncStorage.getItem('serviceman_user');
  return { token, user: user ? JSON.parse(user) : null };
};

export const clearServiceman = async () => {
  await AsyncStorage.removeItem('serviceman_token');
  await AsyncStorage.removeItem('serviceman_user');
};
