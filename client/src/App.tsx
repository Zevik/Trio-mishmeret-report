import { Switch, Route, Link } from "wouter";
import Home from "@/pages/Home";
import Report from "@/pages/Report";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div dir="rtl" lang="he" className="font-sans min-h-screen bg-neutral-50">
      <nav className="bg-primary text-white p-4">
        <div className="container mx-auto flex justify-between">
          <Link href="/" className="font-bold">
            טופס משמרת
          </Link>
          <Link href="/report" className="font-bold">
            דוח שעות
          </Link>
        </div>
      </nav>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/report" component={Report} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return <Router />;
}

export default App;
