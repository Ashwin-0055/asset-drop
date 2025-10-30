"use client"

import { motion } from "framer-motion"
import { ArrowRight, Mail, Sparkles, FolderSync, Zap, Shield, CheckCircle2, Link as LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function LandingPage() {
  const router = useRouter()

  const handleGetStarted = () => {
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AssetDrop
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Button variant="outline" onClick={() => router.push("/login")}>
              Sign In
            </Button>
          </motion.div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Stop emailing files, start sharing experiences</span>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent leading-tight"
          >
            Professional File Sharing
            <br />
            Made Simple
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto"
          >
            Create branded asset pages, share with a link, and track every download.
            No more email attachments, no more version confusion.
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="flex justify-center items-center"
          >
            <Button size="lg" onClick={handleGetStarted} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Get Started
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>

          <motion.p
            variants={fadeInUp}
            className="text-sm text-slate-500 mt-4"
          >
            No credit card required. Free forever for personal use.
          </motion.p>
        </motion.div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {[
            {
              icon: Mail,
              title: "Stop Email Chaos",
              description: "No more 25MB file limits, bounced emails, or lost attachments in endless threads. Share assets the modern way.",
              gradient: "from-blue-500 to-cyan-500"
            },
            {
              icon: Sparkles,
              title: "Professional Experience",
              description: "Create beautiful branded pages with your logo, colors, and messaging. Impress clients with every delivery.",
              gradient: "from-purple-500 to-pink-500"
            },
            {
              icon: FolderSync,
              title: "Auto Organization",
              description: "Connect Google Drive and automatically organize files into projects. Everything stays in sync, nothing gets lost.",
              gradient: "from-orange-500 to-red-500"
            }
          ].map((benefit, index) => (
            <motion.div key={index} variants={fadeInUp}>
              <Card className="p-8 h-full hover:shadow-lg transition-shadow border-2 hover:border-blue-200">
                <div className={`w-12 h-12 bg-gradient-to-br ${benefit.gradient} rounded-xl flex items-center justify-center mb-4`}>
                  <benefit.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">{benefit.title}</h3>
                <p className="text-slate-600 leading-relaxed">{benefit.description}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Feature Showcase */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="max-w-6xl mx-auto"
        >
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-slate-900">Everything you need to share files professionally</h2>
            <p className="text-xl text-slate-600">Built for designers, developers, and creative professionals</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div variants={fadeInUp}>
              <div className="space-y-6">
                {[
                  {
                    icon: Zap,
                    title: "Lightning Fast Setup",
                    description: "Create your first asset page in under 60 seconds. No training required."
                  },
                  {
                    icon: Shield,
                    title: "Secure & Private",
                    description: "Password protect pages, set expiration dates, and control who sees what."
                  },
                  {
                    icon: CheckCircle2,
                    title: "Real-time Analytics",
                    description: "Know exactly when clients view and download your files. No more guessing."
                  },
                  {
                    icon: LinkIcon,
                    title: "One Simple Link",
                    description: "Share a single link that contains everything. Works on any device, anywhere."
                  }
                ].map((feature, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                        <feature.icon className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1 text-slate-900">{feature.title}</h3>
                      <p className="text-slate-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-3xl"></div>
                <Card className="relative p-6 bg-white/80 backdrop-blur">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b">
                      <div>
                        <h4 className="font-semibold text-slate-900">Brand Assets - Q1 2025</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Shared with 3 clients</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs text-slate-600">Active</span>
                      </div>
                    </div>

                    {/* File List */}
                    <div className="space-y-2">
                      {[
                        { name: "Logo_Package.zip", size: "2.4 MB", icon: "📦", color: "from-blue-400 to-blue-500" },
                        { name: "Brand_Guidelines.pdf", size: "1.8 MB", icon: "📄", color: "from-purple-400 to-purple-500" },
                        { name: "Product_Mockups.psd", size: "15.2 MB", icon: "🎨", color: "from-pink-400 to-pink-500" }
                      ].map((file, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-lg hover:shadow-sm transition-all group">
                          <div className={`w-10 h-10 bg-gradient-to-br ${file.color} rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform`}>
                            {file.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-slate-900 truncate">{file.name}</div>
                            <div className="text-xs text-slate-500">{file.size}</div>
                          </div>
                          <CheckCircle2 className="w-4 h-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                    </div>

                    {/* Stats Footer */}
                    <div className="pt-4 border-t flex items-center justify-between text-xs">
                      <div className="flex items-center gap-4">
                        <span className="text-slate-600">
                          <span className="font-semibold text-blue-600">24</span> downloads
                        </span>
                        <span className="text-slate-600">
                          <span className="font-semibold text-purple-600">12</span> views
                        </span>
                      </div>
                      <span className="text-slate-500">Updated 2h ago</span>
                    </div>
                  </div>
                </Card>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900">AssetDrop</span>
          </div>
          <p className="text-slate-600 text-sm">
            2025 AssetDrop. Professional file sharing made simple.
          </p>
          <div className="flex gap-6 text-sm text-slate-600">
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
