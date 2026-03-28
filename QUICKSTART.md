# 🚀 PrivacyScore - Quick Start Guide

**by @PrivMITLab**

---

## ⚡ 30-Second Setup

### Option 1: Use Online (No Setup)
Just visit the deployed website and start scanning!

### Option 2: Local Development
```bash
# Clone or download the project
cd privacy-score

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

### Option 3: Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel deploy

# That's it! Your site is live.
```

---

## 🎯 How to Scan a Website

1. **Enter URL** → Type website address (e.g., `example.com`)
2. **Click Scan** → Press "Scan Website" button or Enter key
3. **Wait** → Watch the progress bar (takes 2-5 seconds)
4. **View Results** → See privacy score and detailed analysis

---

## 📊 Understanding Results

### Privacy Score
```
90-100 🟢 Excellent  - Very privacy-friendly
70-89  🟢 Good       - Minor privacy concerns
50-69  🟡 Moderate   - Some privacy issues
30-49  🟠 Poor       - Many privacy concerns
0-29   🔴 Very Poor  - Heavy tracking
```

### What Affects Score?
- ❌ Trackers found (-10 points each)
- ❌ Third-party domains (-5 points each)
- ❌ Cookies detected (-5 points)

---

## 🎨 Using Dark Mode

Click the **Sun/Moon icon** in the top-right corner to toggle between dark and light themes.

Your preference is saved automatically!

---

## 📜 View Scan History

1. Click the **History icon** (clock symbol)
2. See your last 10 scans
3. Click any item to reload results
4. Click **Clear** to delete history

---

## 💾 Export Results

1. After scanning, click **Export** button
2. JSON file downloads automatically
3. File contains complete scan data
4. Save or share the file

---

## 📤 Share Results

1. Click **Share** button
2. Choose app to share with (Twitter, WhatsApp, etc.)
3. Or copy to clipboard
4. Results include @PrivMITLab credit

---

## 🔍 What Gets Detected?

### 35+ Trackers Including:
- Google Analytics
- Facebook Pixel
- Hotjar
- Mixpanel
- Google Tag Manager
- And 30+ more...

### Also Detects:
- Third-party scripts
- External domains
- Cookie usage
- HTTPS status
- Total scripts count
- iFrames count

---

## ⚠️ Common Issues

### "Website blocks external scanning"
- **Cause**: CORS policy (security feature)
- **Solution**: This is normal. Many sites block external requests.
- **Alternative**: Check site's source code manually

### "Invalid URL"
- **Cause**: Wrong format
- **Solution**: Use format like `example.com` or `https://example.com`

### Scan takes too long
- **Cause**: Large website or slow connection
- **Solution**: Wait up to 10 seconds, or try again

---

## 💡 Pro Tips

1. **Compare Sites**: Scan multiple sites to compare privacy
2. **Check History**: Use history to track changes over time
3. **Export Important Scans**: Save results for documentation
4. **Share Awareness**: Share low scores to raise privacy awareness
5. **Use Dark Mode**: Easier on eyes for extended use

---

## 📱 Mobile Usage

PrivacyScore works great on mobile!

- **Touch-friendly** buttons
- **Responsive** layout
- **Share** directly to social apps
- **Save** results to device

---

## 🔒 Privacy Guarantee

✅ **No data collected**  
✅ **No cookies set**  
✅ **No analytics**  
✅ **No tracking**  
✅ **100% client-side**  
✅ **All scans local**  

Your scans never leave your browser!

---

## 🛠️ Quick Commands

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Deployment
vercel deploy        # Deploy to Vercel
```

---

## 📚 More Documentation

- **README.md** - Complete documentation
- **FEATURES.md** - Detailed features list
- **USAGE_GUIDE.md** - Hindi/English guide
- **SUMMARY.md** - Project summary

---

## 🆘 Need Help?

1. Check **USAGE_GUIDE.md** for detailed instructions
2. Review **FEATURES.md** for capabilities
3. Open issue on **GitHub**
4. Contact **@PrivMITLab** on Twitter

---

## 🎉 You're Ready!

Start scanning websites and discover their privacy practices!

**Remember**: Higher score = Better privacy 🛡️

---

*Made with ❤️ by @PrivMITLab*

**PrivacyScore v2.0** - Privacy First. Always.
