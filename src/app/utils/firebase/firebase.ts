import admin from "firebase-admin";
import serviceAccount from "../../../../config/notification-test-ed116-firebase-adminsdk-fbsvc-fa0f006e18.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

export default admin;
