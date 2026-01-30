# Social Engineering Dashboard

A professional dashboard for monitoring and analyzing phishing sites and social engineering attacks.

## 🚀 Features

- 📊 Interactive data visualization with charts
- 🔍 Advanced filtering by date, sector, and attack goal
- 📸 Screenshot preview for each phishing site
- 📱 Responsive design
- 🎨 Modern dark-themed UI

## 📁 Project Structure

```
social-dashboard/
├── index.html          # Main dashboard file
├── images/             # Screenshots folder (2.png, 3.png, etc.)
└── README.md           # This file
```

## 🔧 Setup

1. Clone this repository
2. Add your phishing site screenshots to the `images/` folder
   - Name them as: `2.png`, `3.png`, `4.png`, etc.
3. Open `index.html` in a browser
4. Upload your CSV file with the following columns:
   - Site
   - Last seen
   - Available
   - is italian?
   - Comments
   - Screenshot
   - SECTOR ATTACKED
   - ATTACK GOAL

## 📊 CSV Format

Your CSV file should follow this structure:

```csv
Site,Last seen,Available,is italian?,Comments,Screenshot,SECTOR ATTACKED,ATTACK GOAL
http://example.com,20/01/2025 11:44,S,s,Description,2.png,ENTERTAINMENT,ACCOUNT THEFT
```

## 🌐 GitHub Pages

To deploy on GitHub Pages:

1. Go to repository Settings
2. Navigate to Pages section
3. Select branch: `main`
4. Select folder: `/ (root)`
5. Click Save
6. Your site will be available at: `https://yourusername.github.io/repository-name/`

## 📝 Usage

1. Open the dashboard
2. Click on the upload area or drag & drop your CSV file
3. View the data in the table and charts
4. Use filters to analyze specific sectors or time periods
5. Click on screenshots to view them in full size

## 🛠️ Technologies Used

- HTML5
- CSS3
- JavaScript (Vanilla)
- Chart.js for data visualization
- Modern CSS Grid & Flexbox

## 📄 License

This project is for internal use only.

## 👤 Author

Your Name / Organization

---

**Note:** Make sure to add your screenshot files (2.png, 3.png, etc.) to the `images/` folder before deploying.
