# 💰 Budget Tracking App

A modern, highly polished Budget Tracking application built with **React Native (Expo)** and **TypeScript**. Designed for simplicity and visual appeal, offering a premium iOS-style experience.

## ✨ Key Features

### 📊 Dashboard & Monitoring
*   **Smart Overview**: Real-time tracking of "Remaining Balance", "Total Spent", and "Saved" amount.
*   **Monthly Budgeting**: Set and edit your monthly spending limits dynamically.
*   **Live Progress**: Visual progress bar indicating budget consumption.

### ₿ Crypto Portfolio
*   **Asset Tracking**: Track your cryptocurrency holdings with real-time value updates.
*   **Interactive Charts**: 
    *   **Scrubbing**: Drag across charts to see precise price and date history.
    *   **Live Updates**: Header displays the specific price and value as you interact.
    *   **Unit Price Display**: Instantly view the "1 Coin = $Price" conversion while scrubbing.

### 💰 Smarter Budgeting
*   **Global Layout**: Improved header design with "Month Picker" modal for quick navigation.
*   **Budget Propagation**: Changing a budget limits now effectively sets a new baseline for all future months (Lookback Strategy).

### 💸 Transaction Management
*   **Daily Breakdown**: Transactions are automatically grouped by date for easy viewing.
*   **Recurring Expenses**: 
    *   One-tap "Repeats Monthly" toggle.
    *   **Smart Logic**: Changes propagate intelligently (e.g., disabling a recurring expense updates future months automatically).
*   **Quick Add**: Streamlined entry form with pre-selected Category Chips.

### 📈 Statistics & Insights
*   **Interactive Donut Chart**: Visualize your spending distribution instantly.
*   **Category Breakdown**: Detailed list with consistent vector icons, progress bars, and percentage shares.
*   **Visual Legends**: Color-coded categories for quick recognition.

### 🎨 Refined UI/UX
*   **Premium Visuals**: Clean cards with soft shadows and rounded corners.
*   **Vector Icons**: High-quality Lucide icons used consistently across Dashboard and Stats.

### ⚙️ Data & Reliability
*   **Local Persistence**: All data is securely stored on-device using `AsyncStorage`.
*   **Data Management**: Built-in utilities to clear storage or reset data (safe-guarded).
*   **Offline First**: Works completely offline.

---

## 🛠️ Technology Stack

*   **Framework**: React Native (Expo SDK 52)
*   **Language**: TypeScript
*   **Navigation**: Expo Router (File-based routing)
*   **Styling**: Custom Design System (Lucide Icons, Premium Color Palette)
*   **Charts**: React-Native-SVG
*   **Storage**: @react-native-async-storage/async-storage

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (LTS)
*   npm or yarn

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository_url>
    cd budget-tracker
    ```


2.  **Install Dependencies**:

    > **Note**: You may need to use `--legacy-peer-deps` to resolve dependency conflicts.
    ```bash
    npm install --legacy-peer-deps
    ```

3.  **Run the App**:
    ```bash
    npx expo start
    ```
    *   Press `i` to open in iOS Simulator
    *   Press `a` to open in Android Emulator
    *   Scan QR code to run on a physical device via Expo Go.

---




## 📝 License

This project is licensed under the MIT License.
