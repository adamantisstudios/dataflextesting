import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Shield, Mail, Phone, MapPin, Facebook, Twitter, Instagram } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="bg-white rounded-full p-2 w-10 h-10 flex items-center justify-center border-2 border-green-500 shadow-lg">
                <img src="/images/logo.png" alt="DataFlex Logo" className="w-6 h-6 object-contain" />
              </div>
              <span className="text-xl lg:text-2xl font-bold">DataFlexAgent.com</span>
            </div>
            <p className="text-gray-400 leading-relaxed text-sm lg:text-base">
              Ghana's most reliable data reselling platform. Connect with clients and earn generous commissions on every
              data bundle sale.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://facebook.com/dataflexgh"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
              >
                <Facebook className="h-5 w-5 text-white" />
              </a>
              <a
                href="https://twitter.com/dataflexgh"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-green-400 rounded-full flex items-center justify-center hover:bg-green-500 transition-colors"
              >
                <Twitter className="h-5 w-5 text-white" />
              </a>
              <a
                href="https://instagram.com/dataflexgh"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center hover:bg-pink-700 transition-colors"
              >
                <Instagram className="h-5 w-5 text-white" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm lg:text-base">
              <li>
                <Link href="/agent/register" className="text-gray-400 hover:text-white transition-colors">
                  Become an Agent
                </Link>
              </li>
              <li>
                <Link href="/agent/login" className="text-gray-400 hover:text-white transition-colors">
                  Agent Login
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Support</h3>
            <ul className="space-y-2 text-sm lg:text-base">
              <li className="flex items-center space-x-2 text-gray-400">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>0242799990</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-400">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="break-all">sales.dataflex@gmail.com</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-400">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>Accra, Ghana</span>
              </li>
            </ul>
          </div>

          {/* Admin Access */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Admin Access</h3>
            <p className="text-gray-400 text-sm">Authorized personnel only</p>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white w-full sm:w-auto"
            >
              <Link href="/admin">
                <Shield className="h-4 w-4 mr-2" />
                Admin Panel
              </Link>
            </Button>
            <p className="text-xs text-gray-500">Secure access for platform management</p>
          </div>
        </div>

        <Separator className="my-6 lg:my-8 bg-gray-700" />

        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-gray-400 text-sm">© 2025 DataFlexAgent.com. All rights reserved.</div>
          <div className="flex flex-wrap justify-center gap-4 lg:gap-6 text-sm">
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
