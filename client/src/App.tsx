import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import NotFound from "@/pages/NotFound";
import ArticlePage from "@/pages/ArticlePage";
import BtcDepositPage from "@/pages/BtcDepositPage";
import BtcDepositsPage from "@/pages/BtcDepositsPage";
import AssetPage from "@/pages/AssetPage";
import AdminPage from "@/pages/AdminPage";
import AdminLoginPage from "@/pages/AdminLoginPage";
import CalendarPage from "@/pages/CalendarPage";
import ChartsPage from "@/pages/ChartsPage";
import CookiesPage from "@/pages/CookiesPage";
import Home from "@/pages/Home";
import MarketPage from "@/pages/MarketPage";
import PortfolioPage from "@/pages/PortfolioPage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import ResearchPage from "@/pages/ResearchPage";
import ScreenerPage from "@/pages/ScreenerPage";
import SettingsPage from "@/pages/SettingsPage";
import WatchlistPage from "@/pages/WatchlistPage";
import InvestmentsPage from "@/pages/InvestmentsPage";
import MyInvestmentsPage from "@/pages/MyInvestmentsPage";
import InvestmentDetailPage from "@/pages/InvestmentDetailPage";
import WithdrawalPage from "@/pages/WithdrawalPage";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/dashboard" component={Home} />
    <Route path="/markets" component={() => <MarketPage category="all" />} />
    <Route path="/stocks/:symbol" component={AssetPage} />
    <Route path="/stocks" component={() => <MarketPage category="stock" />} />
    <Route path="/crypto/:symbol" component={AssetPage} />
    <Route path="/crypto" component={() => <MarketPage category="crypto" />} />
    <Route path="/forex" component={() => <MarketPage category="forex" />} />
    <Route path="/commodities" component={() => <MarketPage category="commodity" />} />
    <Route path="/etfs" component={() => <MarketPage category="etf" />} />
    <Route path="/charts" component={ChartsPage} />
    <Route path="/screener" component={ScreenerPage} />
    <Route path="/watchlist" component={WatchlistPage} />
    <Route path="/portfolio" component={PortfolioPage} />
    <Route path="/investments" component={InvestmentsPage} />
    <Route path="/investments/my-investments" component={MyInvestmentsPage} />
    <Route path="/investments/:id" component={InvestmentDetailPage} />
    <Route path="/calendar" component={CalendarPage} />
    <Route path="/settings" component={SettingsPage} />
    <Route path="/admin/login" component={AdminLoginPage} />
    <Route path="/admin" component={AdminPage} />
    <Route path="/privacy-policy" component={PrivacyPolicyPage} />
    <Route path="/cookies" component={CookiesPage} />
    <Route path="/deposit/eth" component={BtcDepositPage} />
    <Route path="/deposit/btc" component={BtcDepositPage} />
    <Route path="/withdraw" component={WithdrawalPage} />
    <Route path="/withdrawal" component={WithdrawalPage} />
    <Route path="/deposits" component={BtcDepositsPage} />
    <Route path="/earnings" component={CalendarPage} />
    <Route path="/news/article/:slug" component={ArticlePage} />
    <Route path="/news" component={() => <ResearchPage mode="news" />} />
    <Route path="/analysis" component={() => <ResearchPage mode="analysis" />} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark" switchable><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export default App;
