import admin from "firebase-admin";
import serviceAccount from "../../../../config/notification-test-ed116-firebase-adminsdk-fbsvc-94b8544fde.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

export default admin;
