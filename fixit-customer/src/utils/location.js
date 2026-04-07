import * as Location from 'expo-location';

export const checkAndRequestLocation = async () => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();

    if (status === 'granted') {
      return { granted: true };
    }

    const { status: newStatus } =
      await Location.requestForegroundPermissionsAsync();

    return { granted: newStatus === 'granted' };

  } catch (error) {
    console.log("Permission error:", error);
    return { granted: false };
  }
};