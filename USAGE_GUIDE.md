# 🛡️ PrivacyScore - उपयोग गाइड (Usage Guide)

**by @PrivMITLab**

---

## 📖 कैसे उपयोग करें (How to Use)

### स्टेप 1: वेबसाइट खोलें (Open the Website)
PrivacyScore ऐप खोलें। यह डेस्कटॉप, टैबलेट और मोबाइल पर काम करता है।

Open the PrivacyScore app. It works on desktop, tablet, and mobile.

### स्टेप 2: URL दर्ज करें (Enter URL)
- वेबसाइट का URL इनपुट बॉक्स में टाइप करें
- उदाहरण: `https://example.com` या `example.com`
- `https://` जोड़ना जरूरी नहीं है

Type the website URL in the input box.
Example: `https://example.com` or just `example.com`

### स्टेप 3: स्कैन बटन दबाएं (Click Scan)
- **"Scan Website"** बटन पर क्लिक करें
- या कीबोर्ड पर **Enter** दबाएं

Click the **"Scan Website"** button or press **Enter** on your keyboard.

### स्टेप 4: परिणाम देखें (View Results)
स्कैन पूरा होने के बाद, आप देखेंगे:

After scanning completes, you'll see:

#### 📊 Privacy Score (प्राइवेसी स्कोर)
- **0-100** के बीच स्कोर
- **80-100**: 🟢 अच्छा (Good)
- **50-79**: 🟡 मध्यम (Medium)
- **0-49**: 🔴 खराब (Poor)

#### 🔍 Trackers Detected (ट्रैकर्स मिले)
- कितने trackers मिले
- कौन से trackers हैं (Google Analytics, Facebook Pixel, etc.)
- Risk level (High/Medium/Low)

#### 🌐 Third-Party Domains (बाहरी डोमेन)
- कितनी बाहरी वेबसाइट्स के scripts load हो रहे हैं
- सभी third-party domains की लिस्ट

#### 🍪 Cookie Usage (कुकीज)
- Website cookies use कर रही है या नहीं
- localStorage/sessionStorage का उपयोग

#### 🔒 HTTPS Status
- Website सुरक्षित HTTPS use कर रही है या नहीं

---

## 🎨 Features का उपयोग (Using Features)

### Dark Mode / Light Mode
- **ऊपर दाईं ओर** Sun/Moon icon पर क्लिक करें
- Theme preference save रहता है

Click the **Sun/Moon icon** in the top-right to toggle dark/light mode.

### Scan History
- **History icon** (घड़ी जैसा) पर क्लिक करें
- पिछले 10 scans देखें
- किसी भी पुराने scan पर क्लिक करके results देखें
- **Clear** बटन से history delete करें

Click the **History icon** to view last 10 scans. Click any item to reload results.

### Export Results
- **Export** बटन पर क्लिक करें
- JSON file download होगी
- File name: `privacyscore-domain-timestamp.json`

Click **Export** to download results as JSON file.

### Share Results
- **Share** बटन पर क्लिक करें
- Social media पर share करें
- या clipboard में copy करें

Click **Share** to share results on social media or copy to clipboard.

---

## 📋 Score कैसे calculate होता है?

### Calculation Formula
```
शुरुआती स्कोर = 100

कटौती:
- हर tracker के लिए -10 points
- हर third-party domain के लिए -5 points
- अगर cookies हैं तो -5 points

अंतिम स्कोर = max(0, calculated_score)
```

### Example
```
Website में:
- 2 trackers मिले = -20 points
- 5 third-party domains = -25 points
- Cookies हैं = -5 points

Total कटौती = -50 points
Final Score = 100 - 50 = 50/100 (Moderate)
```

---

## ⚠️ Error Messages का मतलब

### "कृपया website URL दर्ज करें"
- **मतलब**: Input box खाली है
- **समाधान**: कोई URL टाइप करें

### "कृपया valid URL दर्ज करें"
- **मतलब**: URL format गलत है
- **समाधान**: `https://example.com` format use करें

### "यह website external scanning को block करती है (CORS policy)"
- **मतलब**: Website ने third-party requests को block किया है
- **समाधान**: यह सामान्य है। Website का source code manually check करें
- **Note**: यह security feature है, error नहीं

---

## 💡 Tips for Better Results

### 1. Multiple Scans
- अलग-अलग websites scan करें
- Compare privacy scores

### 2. Check History
- पुराने scans compare करें
- देखें कौन सी websites privacy-friendly हैं

### 3. Export Data
- Important scans export करें
- JSON files save रखें

### 4. Share Awareness
- Low privacy scores share करें
- Privacy awareness बढ़ाएं

---

## 🔍 Trackers की जानकारी

### High Risk Trackers (उच्च जोखिम)
- Facebook Pixel
- Google Ads
- Advertising networks
- Social media pixels

### Medium Risk Trackers (मध्यम जोखिम)
- Google Analytics
- Session recording tools
- Marketing platforms

### Low Risk Trackers (कम जोखिम)
- Error tracking (Sentry)
- CDN services (Cloudflare)
- Chat widgets

---

## 📱 Mobile Usage

### Touch Gestures
- **Tap** buttons to click
- **Scroll** to see all results
- **Long press** to copy text

### Screen Sizes
- **Mobile**: Single column layout
- **Tablet**: Two column layout
- **Desktop**: Full feature layout

---

## 🌐 Browser Support

### Supported Browsers
- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers

### Minimum Requirements
- Modern browser (2020+)
- JavaScript enabled
- LocalStorage support

---

## ❓ Frequently Asked Questions (FAQ)

### Q: क्या यह tool मेरा डेटा collect करता है?
**A:** नहीं! यह tool 100% client-side है। कोई डेटा collect या store नहीं होता।

**Q: Does this tool collect my data?**
**A:** No! This tool is 100% client-side. No data is collected or stored.

### Q: Scan fail क्यों होता है?
**A:** CORS policy के कारण। कई websites security के लिए external requests को block करती हैं।

**Q: Why does scan fail?**
**A:** Due to CORS policy. Many websites block external requests for security.

### Q: Privacy score accurate है?
**A:** Score pattern-based detection पर आधारित है। यह estimate है, exact measurement नहीं।

**Q: Is privacy score accurate?**
**A:** Score is based on pattern detection. It's an estimate, not exact measurement.

### Q: कितने trackers detect होते हैं?
**A:** 35+ common trackers detect होते हैं, और नए trackers add किए जा सकते हैं।

**Q: How many trackers are detected?**
**A:** 35+ common trackers are detected, and more can be added.

---

## 🎯 Use Cases

### Regular Users (नियमित उपयोगकर्ता)
- Website use करने से पहले privacy check करें
- Safe websites चुनें
- Privacy awareness बढ़ाएं

### Developers (डेवलपर्स)
- अपनी websites audit करें
- GDPR/CCPA compliance check करें
- Trackers remove करें

### Security Researchers (सुरक्षा शोधकर्ता)
- Tracking patterns analyze करें
- Privacy trends study करें
- Reports create करें

### Businesses (व्यापार)
- Competitor websites analyze करें
- Privacy standards maintain करें
- Customer trust build करें

---

## 📞 Support & Contact

**Author**: @PrivMITLab

**GitHub**: https://github.com/PrivMITLab

**Twitter**: https://twitter.com/PrivMITLab

**Issues**: GitHub पर issue open करें

---

## 📄 License

MIT License - स्वतंत्र रूप से use, modify और distribute करें

---

*PrivacyScore v2.0 - Made with ❤️ by @PrivMITLab*

**Privacy First. Always.** 🛡️
