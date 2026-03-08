import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, BarChart3, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">TradeFlow</span>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" className="text-foreground hover:bg-secondary">
              Documentation
            </Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-block px-4 py-2 bg-secondary rounded-full border border-border">
              <p className="text-sm font-medium text-foreground">
                ✨ Power your trading with modern APIs
              </p>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-foreground text-pretty leading-tight">
              Trade smarter with real-time market data
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
              Connect to live trading APIs, manage your portfolio, and make informed decisions with advanced analytics and real-time updates.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                Start Trading <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-border hover:bg-secondary">
                View API Docs
              </Button>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl blur-2xl" />
            <div className="relative bg-card border border-border rounded-2xl p-6 shadow-lg">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">Portfolio Value</p>
                    <p className="text-3xl font-bold text-foreground">$24,580.50</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-primary">+12.5%</p>
                    <p className="text-xs text-muted-foreground">Today</p>
                  </div>
                </div>
                
                <div className="h-32 bg-secondary rounded-lg flex items-end justify-between p-4 gap-1">
                  {[40, 65, 45, 80, 55, 70, 50].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-primary/60 hover:bg-primary rounded-t-sm transition-all"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-3 pt-4">
                  <div className="bg-secondary rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Holdings</p>
                    <p className="text-lg font-semibold text-foreground">8</p>
                  </div>
                  <div className="bg-secondary rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Gain</p>
                    <p className="text-lg font-semibold text-primary">+$2,850</p>
                  </div>
                  <div className="bg-secondary rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Daily</p>
                    <p className="text-lg font-semibold text-foreground">$1,245</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Everything you need to trade
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Advanced tools and real-time data to help you make better trading decisions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <TrendingUp className="w-6 h-6" />,
                title: "Real-Time Data",
                description: "Live market prices, charts, and portfolio updates as they happen"
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: "Advanced Analytics",
                description: "Deep insights with technical analysis and market trends"
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Instant Execution",
                description: "Fast and reliable trade execution with minimal latency"
              }
            ].map((feature, i) => (
              <div key={i} className="p-6 bg-background rounded-xl border border-border hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Ready to start trading?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of traders using TradeFlow to manage their portfolios and make smarter decisions.
          </p>
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground text-sm">
          <p>© 2024 TradeFlow. Powered by Trade Republic API.</p>
        </div>
      </footer>
    </div>
  );
}
