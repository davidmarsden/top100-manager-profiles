# Top 100 Manager Profiles

Interactive web application celebrating 10 years and 25 seasons of Top 100 Soccer Manager community.

## 🚀 Features

- **Manager Directory**: Search and filter all 100 managers
- **Detailed Profiles**: Rich profiles with stats, achievements, and stories
- **Manager Comparison**: Side-by-side comparison tool
- **Community Driven**: Request profiles and vote on priorities
- **Real-time Updates**: Daily sync with latest game data

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Netlify Functions (Node.js)
- **Database**: Netlify Blobs
- **Deployment**: Netlify + GitHub Actions
- **Build Tool**: Vite

## 🔧 Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup
```bash
git clone https://github.com/yourusername/top100-manager-profiles.git
cd top100-manager-profiles
npm install
npm run dev
```

### Environment Variables
Create a `.env` file:
```
SOCCER_MANAGER_API_KEY=your_api_key
DATABASE_URL=your_database_connection
DISCORD_WEBHOOK_URL=your_webhook_url
```

## 📊 Data Sources

- Historical league tables from 25 seasons
- Trophy records and achievements
- Manager statistics and performance data
- Community engagement metrics

## 🚀 Deployment

1. **Connect to Netlify**
   - Link your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`

2. **Set Environment Variables** in Netlify dashboard

3. **Deploy**
   - Push to main branch triggers automatic deployment
   - Pull requests create preview deployments

## 📱 Mobile Support

Fully responsive design optimized for:
- Mobile phones (320px+)
- Tablets (768px+)
- Desktop (1024px+)

## 🎯 Manager Types

- **Legends**: Hall of fame managers (Scott McKenzie)
- **Modern Dynasty**: Current powerhouses (André Libras-Boas)
- **Community Pillars**: Activity champions (Glen Mullan)
- **Administrators**: Rule enforcers (David Marsden)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Top 100 community for 25 seasons of dedication
- All managers who make this community special
- Soccer Manager Worlds for the platform
