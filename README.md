# 💰 Money Tracking & POS System

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-cyan?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

A comprehensive **financial tracking and Point of Sale (POS) system** built with modern web technologies. Perfect for small to medium businesses looking for an all-in-one solution to manage sales, inventory, customers, and financial transactions.

## ✨ Key Features

### 🏪 Advanced Point of Sale (POS)
- **Smart Product Search**: Search by barcode, name, or ID with real-time suggestions
- **Customer Management**: Integrated customer database with loyalty points and discounts
- **Multiple Payment Methods**: Support for cash and card payments
- **Real-time Stock Validation**: Prevents overselling with live inventory checks
- **Shift Management**: Complete shift tracking with opening/closing summaries

### 🔄 Advanced Partial Returns System
- **Selective Product Returns**: Choose specific products from invoices to return
- **Flexible Quantity Returns**: Return partial quantities of products
- **Smart Search**: Multi-criteria search (invoice number, customer name, product name, phone)
- **Automatic Stock Adjustment**: Returns products to inventory automatically
- **Financial Integration**: Automatically adjusts shift totals and financial records

### 📦 Inventory Management
- **Real-time Stock Tracking**: Live inventory updates across all operations
- **Stock Movement History**: Complete audit trail of all stock changes
- **Low Stock Alerts**: Automated notifications for products running low
- **Batch Operations**: Bulk stock updates and adjustments
- **Advanced Reporting**: Comprehensive stock reports with filtering

### 👥 Customer Relationship Management
- **Customer Profiles**: Complete customer information management
- **Loyalty Program**: Points-based reward system
- **Purchase History**: Track all customer transactions
- **Custom Discounts**: Flexible discount system per customer
- **Phone-based Search**: Quick customer lookup by phone number

### 💼 Financial Management
- **Transaction Tracking**: Complete financial transaction history
- **Multi-currency Support**: Handle different currencies (primary: EGP)
- **Category Management**: Organize transactions by custom categories
- **Expense Tracking**: Monitor business expenses and income
- **Financial Reports**: Detailed financial analytics and reports

### 📊 Advanced Reporting
- **Sales Reports**: Comprehensive sales analytics with date filtering
- **Stock Reports**: Inventory movement and current stock levels
- **Customer Reports**: Customer behavior and purchase patterns
- **Shift Reports**: Daily operations summary and performance metrics
- **Financial Reports**: Revenue, expenses, and profit analysis

### 🛡️ Security & Authentication
- **Role-based Access Control**: Admin, Cashier, and Viewer roles
- **Secure Authentication**: Firebase-based user management
- **Audit Logging**: Complete activity tracking for accountability
- **Data Backup**: Automatic cloud backup with Firebase

## 🎨 Modern User Interface

### 🌈 Enhanced Design Features
- **Gradient Backgrounds**: Beautiful purple-to-blue gradients throughout the app
- **Smooth Animations**: Fluid transitions and hover effects
- **Responsive Design**: Perfect on desktop, tablet, and mobile devices
- **Dark Mode Support**: Easy on the eyes for extended use
- **Interactive Elements**: Engaging user experience with visual feedback

### 🔍 Advanced Search & Filtering
- **Multi-criteria Search**: Search across multiple fields simultaneously
- **Real-time Results**: Instant search results as you type
- **Smart Suggestions**: Contextual search recommendations
- **Advanced Filters**: Filter by date ranges, categories, and custom criteria

## 🚀 Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router for optimal performance
- **TypeScript**: Type-safe development for better code quality
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Lucide React**: Beautiful and consistent icons

### Backend & Database
- **Firebase Firestore**: NoSQL database for real-time data synchronization
- **Firebase Authentication**: Secure user authentication and authorization
- **Firebase Storage**: File storage for receipts and documents

### Additional Libraries
- **Recharts**: Data visualization for reports and analytics
- **PDF Generation**: Automatic invoice and receipt generation
- **QR Code Support**: Product and invoice QR code integration

## Getting Started

### Prerequisites

- Node.js 18 or later
- Firebase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd money-tracking
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or select existing one
   - Enable Firestore Database
   - Go to Project Settings > General > Your apps
   - Add a web app and copy the configuration

4. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` with your Firebase configuration:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Adding Transactions

1. Click the blue "+" button in the bottom-right corner
2. Select transaction type (Income or Expense)
3. Enter amount, category, description, and date
4. Click "Add Transaction"

### Viewing Reports

1. Navigate to the "Reports" tab
2. View categorized breakdowns with pie charts
3. Analyze monthly trends with line and bar charts
4. Export data for external analysis

### Managing Transaction History

1. Go to the "History" tab
2. Use search and filters to find specific transactions
3. Delete transactions using the trash icon
4. View detailed transaction information

## Firebase Setup

### Firestore Security Rules

Add these security rules to your Firestore database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /transactions/{document} {
      allow read, write: if true; // For demo purposes - implement proper auth
    }
  }
}
```

### Collection Structure

The app uses a single `transactions` collection with the following structure:

```javascript
{
  type: 'income' | 'expense',
  amount: number,
  category: string,
  description: string,
  date: Timestamp,
  createdAt: Timestamp
}
```

## Development

### Project Structure

```
src/
├── app/                 # Next.js app router
├── components/          # React components
├── lib/                 # Utility functions and Firebase config
└── types/              # TypeScript type definitions
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically with each push

### Environment Variables for Production

Make sure to add all environment variables from `.env.local` to your deployment platform.

## Customization

### Adding New Categories

Edit the category arrays in `src/components/AddTransaction.tsx`:

```typescript
const INCOME_CATEGORIES = [
  'Sales Revenue',
  'Service Income',
  // Add your categories here
];

const EXPENSE_CATEGORIES = [
  'Office Supplies',
  'Marketing',
  // Add your categories here
];
```

### Modifying Colors and Styling

The app uses Tailwind CSS. You can customize colors and styling by:

1. Editing `tailwind.config.js`
2. Modifying component classes
3. Adding custom CSS in `src/app/globals.css`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
