
import axios from 'axios';

export const getRealDeviceInfo = () => {
    // Get or create persistent device ID
    let deviceId = localStorage.getItem('real_device_id');
    if (!deviceId) {
        deviceId = generateDeviceFingerprint();
        localStorage.setItem('real_device_id', deviceId);
    }
    
    // Get screen dimensions safely
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const screenColorDepth = window.screen.colorDepth;
    
    return {
        deviceId: deviceId,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${screenWidth}x${screenHeight}`,
        screenColorDepth: screenColorDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
        deviceMemory: navigator.deviceMemory || 'unknown',
        touchSupport: 'ontouchstart' in window,
        cookieEnabled: navigator.cookieEnabled,
        localStorage: !!window.localStorage,
        sessionStorage: !!window.sessionStorage
    };
};

// Generate unique device fingerprint
const generateDeviceFingerprint = () => {
    const components = [
        navigator.userAgent,
        navigator.language,
        window.screen.width + 'x' + window.screen.height,
        window.screen.colorDepth,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        navigator.hardwareConcurrency,
        navigator.deviceMemory
    ];
    
    let hash = 0;
    const str = components.join('|');
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    
    return `FP_${Math.abs(hash).toString(16)}_${Date.now().toString(36)}`;
};

// Get real IP and location info
export const getNetworkInfo = async () => {
    try {
        const response = await axios.get('https://ipapi.co/json/');
        return {
            ipAddress: response.data.ip,
            city: response.data.city,
            region: response.data.region,
            country: response.data.country_name,
            postal: response.data.postal,
            latitude: response.data.latitude,
            longitude: response.data.longitude,
            isp: response.data.org,
            timezone: response.data.timezone
        };
    } catch (error) {
        console.error('Failed to get network info:', error);
        return null;
    }
};

// Register device with backend
export const registerDevice = async () => {
    const deviceInfo = getRealDeviceInfo();
    const networkInfo = await getNetworkInfo();
    
    try {
        await axios.post('http://localhost:5000/api/device/register', {
            deviceInfo: deviceInfo,
            networkInfo: networkInfo
        }, { withCredentials: true });
        return { success: true, deviceInfo, networkInfo };
    } catch (error) {
        console.error('Device registration failed:', error);
        return { success: false, error: error.message };
    }
};