import { Bot, Share2, Sparkles, Workflow } from "lucide-react"

interface AuthLayoutProps {
  children: React.ReactNode
}

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Architecture Generation",
    description: "Describe your system, AI maps it to nodes and edges on a live canvas.",
  },
  {
    icon: Share2,
    title: "Real-time Collaboration",
    description: "Live cursors, presence indicators, and shared node editing across your team.",
  },
  {
    icon: Bot,
    title: "Instant Spec Generation",
    description: "Export a complete Markdown technical spec directly from the canvas graph.",
  },
]

function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden flex-col justify-center overflow-hidden border-r border-border px-16 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-surface bg-[radial-gradient(ellipse_120%_80%_at_0%_0%,var(--accent-primary-dim),transparent_60%)]"
        />

        <div className="relative flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Workflow className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-lg font-medium text-foreground">
            omega AI
          </span>
        </div>

        <h1 className="relative mt-10 max-w-md text-4xl font-semibold tracking-tight text-foreground">
          Design systems at the speed of thought.
        </h1>
        <p className="relative mt-4 max-w-sm text-sm text-muted-foreground">
          Describe your architecture in plain English. omega AI maps it to a
          shared canvas your whole team can refine in real time.
        </p>

        <ul className="relative mt-10 space-y-5">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <p className="relative mt-auto pt-10 text-xs text-copy-faint">
          &copy; {new Date().getFullYear()} omega AI. All rights reserved.
        </p>
      </div>

      <div className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}

export { AuthLayout }
