# 🚀 Quick Start Guide

## Start Both Servers

### Terminal 1 - Backend Server

```powershell
cd "c:\Users\mpawa\OneDrive\Desktop\MusicPlayer\mern-music\server"
npm run dev
```

✅ Server running on http://localhost:5000

### Terminal 2 - Frontend Client

```powershell
cd "c:\Users\mpawa\OneDrive\Desktop\MusicPlayer\mern-music\client"
npm run dev
```

✅ Client running on http://localhost:3000

## 🎯 Access the Application

Open your browser and go to: **http://localhost:3000**

## ✨ What's New

### UI Improvements

- 🎨 **Clean Black & White Theme** - Modern, minimalist design
- 🔄 **Source Toggle** - Switch between YouTube and Jamendo
- 🎵 **Now Playing Section** - Dedicated area for current track
- 🎯 **Improved Search** - Better search bar with icons
- 📱 **Responsive Design** - Works on all screen sizes
- ✨ **Smooth Animations** - Hover effects and transitions
- 🎬 **Visual Play Indicators** - Know what's playing at a glance

### Backend Connection

- ✅ MongoDB connected for caching
- ✅ YouTube API integrated
- ✅ Jamendo API integrated
- ✅ Proxy configured in Vite for seamless API calls

## 🎮 How to Use

1. **Choose Source**: Click YouTube or Jamendo button
2. **Search**: Type your query and click Search or press Enter
3. **Play**: Click on any song card to play
4. **Enjoy**: Music plays in the "Now Playing" section

## 🔧 Troubleshooting

### Backend not connecting?

- Make sure MongoDB URI is correct in `.env`
- Check if server is running on port 5000
- Verify API keys are valid

### Frontend issues?

- Clear browser cache
- Check browser console for errors
- Restart the dev server

## 📞 Need Help?

Check the main README.md for detailed documentation.
