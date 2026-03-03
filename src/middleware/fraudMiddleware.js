const detectFraud = async (req, res, next) => {
    try {
        const { headers, ip } = req;

        // 1. VPN / Proxy Block (Basic header check)
        const suspiciousHeaders = [
            'x-forwarded-for',
            'via',
            'x-real-ip',
            'forwarded',
            'x-cluster-client-ip',
            'proxy-client-ip',
            'wl-proxy-client-ip'
        ];

        let isProxy = false;
        for (const header of suspiciousHeaders) {
            if (headers[header]) {
                // Some specific environments use x-forwarded-for legitimately, refine in production
                isProxy = true;
                // In strict mode, we might reject immediately:
                // return res.status(403).json({ message: 'Proxy or VPN detected.' });
            }
        }

        // 2. Device Lock & Root/Emulator detection
        // Expected to be sent from the frontend headers or body
        const clientDeviceId = headers['x-device-id'] || req.body.deviceId;
        const isEmulator = headers['x-is-emulator'] === 'true';
        const isRooted = headers['x-is-rooted'] === 'true';

        if (isEmulator || isRooted) {
            return res.status(403).json({
                message: 'Forbidden: App cannot run on rooted devices or emulators.'
            });
        }

        // Pass deviceId along for the controllers to check/bind to the UID
        if (clientDeviceId) {
            req.deviceId = clientDeviceId;
        }

        // Next stages checks like Binding UID to DeviceID happens mostly at 
        // the Auth/Login controller or Spin/Streak claims.

        next();
    } catch (error) {
        console.error('Anti-Fraud Middleware error:', error);
        res.status(500).json({ message: 'Internal Server Error during security check' });
    }
};

module.exports = { detectFraud };
