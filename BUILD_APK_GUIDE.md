# 📱 How to Build APK for Your Android Phone

## 🚀 Method 1: EAS Build (Cloud Build - Easiest)

This method builds your app in Expo's cloud servers. You don't need Android Studio or any special setup!

### **Prerequisites:**
- Expo account (free) - Sign up at https://expo.dev/signup
- Internet connection

### **Step-by-Step Guide:**

#### **1. Install EAS CLI (if not already installed)**
```bash
cd /app/frontend
npm install -g eas-cli
```

#### **2. Login to Your Expo Account**
```bash
eas login
```
Enter your Expo credentials. If you don't have an account, create one first.

#### **3. Enable Real Notifications (Important!)**

First, switch to the real notification service:

**In `/app/frontend/store/taskStore.ts`:**
Change line 3 from:
```typescript
import * as NotificationService from '../services/notifications.expo-go';
```
To:
```typescript
import * as NotificationService from '../services/notifications';
```

**In `/app/frontend/app/index.tsx`:**
Change line 17 from:
```typescript
import { requestNotificationPermissions } from '../services/notifications.expo-go';
```
To:
```typescript
import { requestNotificationPermissions } from '../services/notifications';
```

**In `/app/frontend/app/settings.tsx`:**
Change line 12 from:
```typescript
import { getAllScheduledNotifications } from '../services/notifications.expo-go';
```
To:
```typescript
import { getAllScheduledNotifications } from '../services/notifications';
```

#### **4. Build the APK**
```bash
cd /app/frontend
eas build --platform android --profile preview
```

**What happens:**
- Expo uploads your code to their servers
- They build a native Android APK (takes 10-20 minutes)
- You'll get a download link when it's done

#### **5. Download and Install**

Once the build completes:
1. You'll see a download URL in the terminal
2. Open that URL on your phone's browser
3. Download the APK
4. Install it (you may need to enable "Install from Unknown Sources" in Android settings)

**Done!** 🎉 You now have a fully functional app with real notifications!

---

## 📋 **Quick Command Reference**

```bash
# Login to Expo
eas login

# Build APK for testing
eas build --platform android --profile preview

# Check build status
eas build:list

# Build for production (Google Play Store)
eas build --platform android --profile production
```

---

## 🔐 **First Time Build Notes**

If this is your first build with EAS:

1. **Android Package Name**: Already set to `com.taskreminder.app`
2. **Keystore**: EAS will automatically generate one for you
3. **Build Time**: First build takes ~15-20 minutes
4. **Cost**: Free tier allows limited builds per month

---

## 📝 **Testing Your APK**

After installing the APK:

1. **Grant Permissions**: The app will ask for notification permissions - tap "Allow"
2. **Create a Test Task**: 
   - Set time for 2-3 minutes from now
   - You should receive 3 notifications:
     - 1 hour before (won't fire if task is less than 1 hour away)
     - 10 minutes before
     - At task time
3. **Test Other Features**:
   - Light/Dark mode toggle
   - Create, edit, delete tasks
   - Calendar view
   - Mark tasks complete

---

## 🎯 **Differences: Expo Go vs APK**

| Feature | Expo Go | Standalone APK |
|---------|---------|----------------|
| Calendar View | ✅ Works | ✅ Works |
| Task Management | ✅ Works | ✅ Works |
| SQLite Storage | ✅ Works | ✅ Works |
| Light/Dark Mode | ✅ Works | ✅ Works |
| **Notifications** | ❌ Disabled | ✅ **Full Support** |
| App Icon | Expo Logo | Your Custom Icon |
| Performance | Good | Better |

---

## 💡 **Tips**

1. **Keep Your Build Link**: Save the download URL from the build output
2. **Share with Friends**: Anyone can install the APK - just share the download link
3. **Updates**: Run the build command again to create a new version
4. **Production Build**: Use `--profile production` when you're ready for Google Play Store

---

## 🐛 **Troubleshooting**

**Build fails?**
- Check your app.json is valid JSON
- Make sure you're logged in: `eas whoami`
- Check your internet connection

**APK won't install?**
- Enable "Install Unknown Apps" for your browser in Android settings
- Go to: Settings → Apps → Your Browser → Install Unknown Apps → Allow

**Notifications not working?**
- Check app permissions in Android Settings → Apps → Task Reminder → Permissions
- Make sure you granted notification permission when prompted

---

## 🎉 **You're All Set!**

Follow the steps above and you'll have your Task Reminder app with **full notification support** installed on your phone in about 20 minutes!

Any questions? Let me know! 😊
